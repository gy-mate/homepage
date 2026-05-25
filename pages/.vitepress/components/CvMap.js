import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const REST_RATIO = 0.1
const SEGMENT_FIT_PADDING = 80
const ZOOM_OUT_PHASE_END = 0.35
const PAN_PHASE_START = ZOOM_OUT_PHASE_END
const PAN_PHASE_END = 0.65
const ZOOM_IN_PHASE_START = PAN_PHASE_END

const STYLES_FOLDER = '/OSM/styles/'
const STYLE_LIGHT = STYLES_FOLDER + 'colorful.json'
const STYLE_DARK = STYLES_FOLDER + 'eclipse.json'

function currentStyleUrl() {
  return document.documentElement.classList.contains('dark') ? STYLE_DARK : STYLE_LIGHT
}

async function loadStyle(styleUrl) {
  const response = await fetch(styleUrl)
  const style = await response.json()
  if (Array.isArray(style.sprite)) {
    style.sprite = style.sprite.map((sprite) => ({
      ...sprite,
      url: new URL(sprite.url, window.location.origin).toString(),
    }))
  } else if (typeof style.sprite === 'string') {
    style.sprite = new URL(style.sprite, window.location.origin).toString()
  }
  return style
}

function readHeadingText(headingElement) {
  const clone = headingElement.cloneNode(true)
  clone.querySelectorAll('a.header-anchor').forEach((anchor) => anchor.remove())
  return clone.textContent.trim()
}

function relocateEntriesIntoTriggers(indexContainer, triggersContainer) {
  const headings = Array.from(
    indexContainer.querySelectorAll('h1, h2, h3, h4, h5, h6')
  )
  const timeline = []
  const headingIdToEntryIndex = new Map()
  const anchorPlaceholders = []
  headings.forEach((headingElement) => {
    const organizationParagraph = headingElement.nextElementSibling
    const dateParagraph = organizationParagraph?.nextElementSibling
    const locationSpan = organizationParagraph?.querySelector('.cv-loc')
    if (!locationSpan) return

    const latitude = parseFloat(locationSpan.dataset.lat)
    const longitude = parseFloat(locationSpan.dataset.lng)
    const mapZoomLevel = parseFloat(locationSpan.dataset.zoom)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return

    const entryIndex = timeline.length
    const triggerElement = document.createElement('div')
    triggerElement.className = 'cv-trigger'
    triggersContainer.appendChild(triggerElement)

    let anchorPlaceholder = null
    const headingId = headingElement.id
    if (headingId) {
      headingElement.removeAttribute('id')
      anchorPlaceholder = document.createElement('span')
      anchorPlaceholder.id = headingId
      anchorPlaceholder.className = 'cv-trigger__anchor'
      anchorPlaceholder.setAttribute('aria-hidden', 'true')
      triggerElement.appendChild(anchorPlaceholder)
      headingIdToEntryIndex.set(headingId, entryIndex)
    }
    anchorPlaceholders.push(anchorPlaceholder)

    const screenReaderWrapper = document.createElement('div')
    screenReaderWrapper.className = 'cv-trigger__sr'
    screenReaderWrapper.appendChild(headingElement)
    if (organizationParagraph) screenReaderWrapper.appendChild(organizationParagraph)
    if (dateParagraph) screenReaderWrapper.appendChild(dateParagraph)
    triggerElement.appendChild(screenReaderWrapper)

    timeline.push({
      job_title: readHeadingText(headingElement),
      organization: locationSpan.textContent.trim(),
      date_range: dateParagraph?.textContent?.trim() ?? '',
      latitude,
      longitude,
      map_zoom_level: mapZoomLevel,
    })
  })
  return { timeline, headingIdToEntryIndex, anchorPlaceholders }
}

function interpolate(fromValue, toValue, fraction) {
  return fromValue + (toValue - fromValue) * fraction
}

function smoothstep(value) {
  return value * value * (3 - 2 * value)
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function easeInOutQuintic(value) {
  return value < 0.5
    ? 16 * value * value * value * value * value
    : 1 - Math.pow(-2 * value + 2, 5) / 2
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export default {
  setup() {
    const mapContainer = ref(null)
    const triggers = ref(null)
    const indexContent = ref(null)
    const map = shallowRef(null)
    const timeline = ref([])
    const markers = []
    const segmentDipTargetZooms = []
    let anchorPlaceholders = []
    let headingIdToEntryIndex = new Map()
    let themeObserver = null
    let rafId = null

    function computeEventProgress() {
      const scrollContainer = triggers.value
      if (!scrollContainer) return 0

      const scrollableHeight = scrollContainer.offsetHeight - window.innerHeight
      if (scrollableHeight <= 0) return 0

      const containerTop = scrollContainer.getBoundingClientRect().top
      const scrollFraction = clamp(-containerTop / scrollableHeight, 0, 1)

      const eventCount = timeline.value.length
      const segmentCount = eventCount - 1
      if (segmentCount <= 0) return 0

      const positionAcrossSegments = scrollFraction * segmentCount
      const segmentIndex = Math.min(segmentCount - 1, Math.floor(positionAcrossSegments))
      const positionInSegment = positionAcrossSegments - segmentIndex

      let eventProgress
      if (positionInSegment < REST_RATIO) {
        eventProgress = segmentIndex
      } else {
        const travelFraction = (positionInSegment - REST_RATIO) / (1 - REST_RATIO)
        eventProgress = segmentIndex + travelFraction
      }
      return clamp(eventProgress, 0, eventCount - 1)
    }

    function recomputeSegmentZoomDips() {
      if (!map.value) return
      segmentDipTargetZooms.length = 0
      for (let segmentIndex = 0; segmentIndex < timeline.value.length - 1; segmentIndex++) {
        const fromEvent = timeline.value[segmentIndex]
        const toEvent = timeline.value[segmentIndex + 1]
        const fromZoom = fromEvent.map_zoom_level ?? 12
        const toZoom = toEvent.map_zoom_level ?? 12
        const endpointMinZoom = Math.min(fromZoom, toZoom)
        const sameLocation =
          fromEvent.longitude === toEvent.longitude &&
          fromEvent.latitude === toEvent.latitude
        if (sameLocation) {
          segmentDipTargetZooms.push(endpointMinZoom)
          continue
        }
        const fitBounds = new maplibregl.LngLatBounds()
        fitBounds.extend([fromEvent.longitude, fromEvent.latitude])
        fitBounds.extend([toEvent.longitude, toEvent.latitude])
        const fitCamera = map.value.cameraForBounds(fitBounds, {
          padding: SEGMENT_FIT_PADDING,
        })
        const viaZoom = fitCamera ? fitCamera.zoom : endpointMinZoom
        segmentDipTargetZooms.push(Math.min(viaZoom, endpointMinZoom))
      }
    }

    function updateCamera() {
      if (!map.value || markers.length === 0) return

      const eventProgress = computeEventProgress()
      const fromEventIndex = Math.floor(eventProgress)
      const toEventIndex = Math.min(timeline.value.length - 1, fromEventIndex + 1)
      const segmentFraction = eventProgress - fromEventIndex
      const fromEvent = timeline.value[fromEventIndex]
      const toEvent = timeline.value[toEventIndex]
      const fromZoom = fromEvent.map_zoom_level ?? 12
      const toZoom = toEvent.map_zoom_level ?? 12

      const rawPanProgress = clamp(
        (segmentFraction - PAN_PHASE_START) / (PAN_PHASE_END - PAN_PHASE_START),
        0,
        1
      )
      const panFraction = easeInOutQuintic(rawPanProgress)
      const center = [
        interpolate(fromEvent.longitude, toEvent.longitude, panFraction),
        interpolate(fromEvent.latitude, toEvent.latitude, panFraction),
      ]

      const zoomOutAmount = easeInOutCubic(
        clamp(segmentFraction / ZOOM_OUT_PHASE_END, 0, 1)
      )
      const zoomInAmount = easeInOutCubic(
        clamp(
          (segmentFraction - ZOOM_IN_PHASE_START) / (1 - ZOOM_IN_PHASE_START),
          0,
          1
        )
      )
      const dipFactor = Math.min(zoomOutAmount, 1 - zoomInAmount)
      const dipTargetZoom = segmentDipTargetZooms[fromEventIndex] ?? Math.min(fromZoom, toZoom)
      const zoomBase = interpolate(fromZoom, toZoom, panFraction)
      const zoom = interpolate(zoomBase, dipTargetZoom, dipFactor)

      map.value.jumpTo({ center, zoom })

      const cardFocusProgress = fromEventIndex + panFraction
      const nearestEventIndex = Math.round(cardFocusProgress)
      markers.forEach((marker, cardIndex) => {
        const cardInner = marker.getElement().firstElementChild
        if (!cardInner) return
        const distanceFromFocus = Math.abs(cardFocusProgress - cardIndex)
        const cardWeight = clamp(1 - distanceFromFocus, 0, 1)
        const easedCardWeight = smoothstep(cardWeight)
        cardInner.style.opacity = (0.25 + 0.75 * easedCardWeight).toFixed(3)
        cardInner.style.transform = `scale(${(0.76 + 0.24 * easedCardWeight).toFixed(3)})`
        cardInner.style.filter = `saturate(${(0.4 + 0.6 * easedCardWeight).toFixed(3)})`
        cardInner.style.zIndex = cardIndex === nearestEventIndex ? '5' : '1'
      })
    }

    function handleScroll() {
      if (rafId != null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        updateCamera()
      })
    }

    function positionAnchorPlaceholders() {
      const scrollContainer = triggers.value
      if (!scrollContainer) return
      const eventCount = timeline.value.length
      const segmentCount = eventCount - 1
      if (segmentCount <= 0) return
      const scrollableHeight = scrollContainer.offsetHeight - window.innerHeight
      if (scrollableHeight <= 0) return
      const triggerElements = Array.from(scrollContainer.querySelectorAll('.cv-trigger'))
      const segmentScrollHeight = scrollableHeight / segmentCount
      anchorPlaceholders.forEach((anchorPlaceholder, entryIndex) => {
        if (!anchorPlaceholder) return
        const triggerElement = triggerElements[entryIndex]
        if (!triggerElement) return
        const relativeTop = entryIndex * (segmentScrollHeight - triggerElement.offsetHeight)
        anchorPlaceholder.style.top = `${relativeTop}px`
      })
    }

    function handleResize() {
      recomputeSegmentZoomDips()
      positionAnchorPlaceholders()
      handleScroll()
    }

    function scrollToEntry(entryIndex) {
      const scrollContainer = triggers.value
      if (!scrollContainer) return
      const scrollableHeight = scrollContainer.offsetHeight - window.innerHeight
      if (scrollableHeight <= 0) return
      const eventCount = timeline.value.length
      if (eventCount <= 1) return
      const targetScrollFraction = entryIndex / (eventCount - 1)
      const containerDocumentTop = window.scrollY + scrollContainer.getBoundingClientRect().top
      const targetScrollY = containerDocumentTop + targetScrollFraction * scrollableHeight
      window.scrollTo({ top: targetScrollY })
    }

    function scrollToHashIfPresent() {
      const hash = window.location.hash
      if (!hash || hash.length < 2) return
      const headingId = decodeURIComponent(hash.slice(1))
      const entryIndex = headingIdToEntryIndex.get(headingId)
      if (entryIndex == null) return
      scrollToEntry(entryIndex)
    }

    onMounted(async () => {
      const relocated = relocateEntriesIntoTriggers(
        indexContent.value,
        triggers.value
      )
      timeline.value = relocated.timeline
      headingIdToEntryIndex = relocated.headingIdToEntryIndex
      anchorPlaceholders = relocated.anchorPlaceholders

      map.value = new maplibregl.Map({
        container: mapContainer.value,
        style: await loadStyle(currentStyleUrl()),
        center: [timeline.value[0].longitude, timeline.value[0].latitude],
        zoom: timeline.value[0].map_zoom_level ?? 12,
        interactive: false,
        attributionControl: { compact: true },
      })

      themeObserver = new MutationObserver(async () => {
        const next = await loadStyle(currentStyleUrl())
        if (map.value && map.value.getStyle()?.sprite !== undefined) {
          map.value.setStyle(next)
        }
      })
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      })

      map.value.on('load', () => {
        timeline.value.forEach((item) => {
          const cardElement = document.createElement('div')
          cardElement.className = 'cv-card'
          cardElement.innerHTML = `
            <div class="cv-card__inner">
              <div class="cv-card__body">
                <div class="cv-card__date"></div>
                <div class="cv-card__title"></div>
                <div class="cv-card__org"></div>
              </div>
              <div class="cv-card__pin"></div>
            </div>
          `
          cardElement.querySelector('.cv-card__date').textContent = item.date_range
          cardElement.querySelector('.cv-card__title').textContent = item.job_title
          cardElement.querySelector('.cv-card__org').textContent = item.organization
          const marker = new maplibregl.Marker({ element: cardElement, anchor: 'bottom' })
            .setLngLat([item.longitude, item.latitude])
            .addTo(map.value)
          markers.push(marker)
        })

        recomputeSegmentZoomDips()
        positionAnchorPlaceholders()
        window.addEventListener('scroll', handleScroll, { passive: true })
        window.addEventListener('hashchange', scrollToHashIfPresent)
        window.addEventListener('resize', handleResize, { passive: true })
        scrollToHashIfPresent()
        updateCamera()
      })
    })

    onBeforeUnmount(() => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('hashchange', scrollToHashIfPresent)
      window.removeEventListener('resize', handleResize)
      if (rafId != null) cancelAnimationFrame(rafId)
      themeObserver?.disconnect()
      markers.length = 0
      segmentDipTargetZooms.length = 0
      map.value?.remove()
    })

    return { mapContainer, triggers, indexContent }
  },
}
