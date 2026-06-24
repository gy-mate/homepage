import maplibregl from 'maplibre-gl'

const STYLES_FOLDER = '/OSM/styles/'
const STYLE_LIGHT = STYLES_FOLDER + 'colorful.json'
const STYLE_DARK = STYLES_FOLDER + 'eclipse.json'

export function currentStyleUrl() {
  return document.documentElement.classList.contains('dark') ? STYLE_DARK : STYLE_LIGHT
}

export async function loadStyle(styleUrl) {
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

export function watchThemeStyle(mapRef) {
  const themeObserver = new MutationObserver(async () => {
    const nextStyle = await loadStyle(currentStyleUrl())
    if (mapRef.value && mapRef.value.getStyle()?.sprite !== undefined) {
      mapRef.value.setStyle(nextStyle)
    }
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return themeObserver
}

export function readHeadingText(headingElement) {
  const clone = headingElement.cloneNode(true)
  clone.querySelectorAll('a.header-anchor').forEach((anchor) => anchor.remove())
  return clone.textContent.trim()
}

export function parseEntry(headingElement) {
  const organizationParagraph = headingElement.nextElementSibling
  const dateParagraph = organizationParagraph?.nextElementSibling
  const locationSpan = organizationParagraph?.querySelector('.cv-loc')
  if (!locationSpan) return null

  const latitude = parseFloat(locationSpan.dataset.lat)
  const longitude = parseFloat(locationSpan.dataset.lng)
  const mapZoomLevel = parseFloat(locationSpan.dataset.zoom)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  return {
    headingElement,
    organizationParagraph,
    dateParagraph,
    entry: {
      job_title: readHeadingText(headingElement),
      organization: locationSpan.textContent.trim(),
      date_range: dateParagraph?.textContent?.trim() ?? '',
      latitude,
      longitude,
      map_zoom_level: mapZoomLevel,
    },
  }
}

export function collectEntries(indexContainer) {
  const headings = Array.from(
    indexContainer.querySelectorAll('h1, h2, h3, h4, h5, h6')
  )
  return headings
    .map((headingElement) => parseEntry(headingElement)?.entry)
    .filter(Boolean)
}

export function createCardElement(item) {
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
  return cardElement
}

export function addCardMarker(map, item) {
  const cardElement = createCardElement(item)
  return new maplibregl.Marker({ element: cardElement, anchor: 'bottom' })
    .setLngLat([item.longitude, item.latitude])
    .addTo(map)
}
