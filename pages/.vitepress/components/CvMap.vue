<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const mapContainer = ref(null)
const triggers = ref(null)
const map = shallowRef(null)
const markers = []
let observer = null
let themeObserver = null

const STYLE_LIGHT = 'https://vector.openstreetmap.org/styles/shortbread/colorful.json'
const STYLE_DARK = 'https://vector.openstreetmap.org/styles/shortbread/eclipse.json'

function currentStyleUrl() {
  return document.documentElement.classList.contains('dark') ? STYLE_DARK : STYLE_LIGHT
}

const timeline = [
  {
    date: 'Jun 2011 – Aug 2015',
    title: 'Child Railway Employee',
    org: 'Hungarian State Railways (MÁV)',
    coords: [18.963545, 47.542476],
    zoom: 14,
  },
  {
    date: 'Jul 2016 – Dec 2019',
    title: 'Co-Founder, then Board Member',
    org: 'Közlekedő Tömeg Egyesület',
    coords: [19.303, 47.190],
    zoom: 7,
  },
  {
    date: 'Oct 2016 – Dec 2020',
    title: 'Passenger Flow Surveyor',
    org: 'Centre for Budapest Transport (BKK)',
    coords: [19.0575269, 47.4984830],
    zoom: 13,
  },
  {
    date: 'Aug 2017',
    title: 'Infrastructure and Services Inspector',
    org: 'Balaton Shipping Co. (BAHART)',
    coords: [17.7855, 46.8583],
    zoom: 10,
  },
  {
    date: 'Feb 2018',
    title: 'Quality of Transport Surveyor',
    org: 'Budapest Airport',
    coords: [19.26006, 47.43267],
    zoom: 14,
  },
  {
    date: 'Jun 2018 – Sep 2019',
    title: 'Station and Train Attendant',
    org: 'Hungarian State Railways (MÁV)',
    coords: [19.020614, 47.464302],
    zoom: 15,
  },
  {
    date: 'Dec 2018',
    title: 'Customer Satisfaction Surveyor',
    org: 'Hungarian State Railways (MÁV)',
    coords: [21.705031, 47.946397],
    zoom: 15,
  },
  {
    date: 'Apr 2019',
    title: 'Passenger Flow Survey Coordinator',
    org: 'Centre for Kecskemét Transport (KeKo) / Mobilissimus Ltd.',
    coords: [19.698207, 46.914220],
    zoom: 14,
  },
  {
    date: 'Jun 2019',
    title: 'Passenger Flow Surveyor',
    org: 'Hungarian State Railways (MÁV)',
    coords: [18.425000, 47.183019],
    zoom: 15,
  },
  {
    date: 'Jun 2019',
    title: 'Matura',
    org: 'Fazekas Mihály Gimnázium',
    coords: [19.076184, 47.489246],
    zoom: 17,
  },
  {
    date: 'Nov 2019',
    title: 'Passenger Flow Survey Coordinator (M2 / M4)',
    org: 'Centre for Budapest Transport (BKK)',
    coords: [19.0826, 47.5004],
    zoom: 14,
  },
  {
    date: 'Jun 2021',
    title: 'Passenger Flow Surveyor',
    org: 'Esztergom City Municipality / Mobilissimus Ltd.',
    coords: [18.742011, 47.794126],
    zoom: 14,
  },
  {
    date: 'Aug 2021',
    title: 'Passenger Information Assistant',
    org: 'Volánbusz Plc.',
    coords: [19.098825, 47.474829],
    zoom: 17,
  },
  {
    date: 'Sep 2019 – Jun 2022',
    title: 'Sociologist (BA)',
    org: 'Eötvös Loránd University (ELTE)',
    coords: [19.062020, 47.474411],
    zoom: 16,
  },
  {
    date: 'May 2024 – present',
    title: 'Project Manager',
    org: 'Schönherz Computer Science Club (KSZK)',
    coords: [19.053117, 47.472989],
    zoom: 17,
  },
  {
    date: 'Sep 2022 – Jul 2025',
    title: 'Computer Science Operational Engineer (BProf)',
    org: 'Budapest University of Technology and Economics (BME)',
    coords: [19.060062, 47.472775],
    zoom: 16,
  },
  {
    date: 'Sep 2024 – present',
    title: 'Java Developer',
    org: 'P92 Digital',
    coords: [19.044977, 47.586088],
    zoom: 13,
  }
]

function activate(idx) {
  markers.forEach((m, i) => {
    m.getElement().classList.toggle('cv-card--active', i === idx)
  })
  const item = timeline[idx]
  map.value.flyTo({
    center: item.coords,
    zoom: item.zoom ?? 12,
    speed: 0.7,
    curve: 1.4,
    essential: true,
  })
}

onMounted(() => {
  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: currentStyleUrl(),
    center: timeline[0].coords,
    zoom: timeline[0].zoom ?? 12,
    interactive: false,
    attributionControl: { compact: true },
  })

  themeObserver = new MutationObserver(() => {
    const next = currentStyleUrl()
    if (map.value && map.value.getStyle()?.sprite !== undefined) {
      map.value.setStyle(next)
    }
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })

  map.value.on('load', () => {
    timeline.forEach((item, idx) => {
      const el = document.createElement('div')
      el.className = 'cv-card'
      el.innerHTML = `
        <div class="cv-card__inner">
          <div class="cv-card__body">
            <div class="cv-card__date">${item.date}</div>
            <div class="cv-card__title">${item.title}</div>
            <div class="cv-card__org">${item.org}</div>
          </div>
          <div class="cv-card__pin"></div>
        </div>
      `
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(item.coords)
        .addTo(map.value)
      markers.push(marker)
    })

    const triggerEls = triggers.value.querySelectorAll('.cv-trigger')
    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible.length) {
          const idx = Number(visible[0].target.dataset.idx)
          activate(idx)
        }
      },
      { threshold: [0.4, 0.6, 0.8], rootMargin: '-20% 0px -20% 0px' }
    )
    triggerEls.forEach((t) => observer.observe(t))
    activate(0)
  })
})

onBeforeUnmount(() => {
  observer?.disconnect()
  themeObserver?.disconnect()
  markers.length = 0
  map.value?.remove()
})
</script>

<template>
  <div class="cv-scroll">
    <div ref="mapContainer" class="cv-map" aria-hidden="true"></div>
    <div ref="triggers" class="cv-triggers">
      <div
        v-for="(item, i) in timeline"
        :key="i"
        :data-idx="i"
        class="cv-trigger"
      >
        <span class="cv-trigger__sr">{{ item.date }} – {{ item.title }}, {{ item.org }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cv-scroll {
  position: relative;
  width: 100%;
}

.cv-map {
  position: sticky;
  top: var(--vp-nav-height, 64px);
  height: calc(100vh - var(--vp-nav-height, 64px));
  width: 100%;
  margin-bottom: calc(-100vh + var(--vp-nav-height, 64px));
}

.cv-triggers {
  position: relative;
  z-index: 2;
  pointer-events: none;
}

.cv-trigger {
  height: 100vh;
  scroll-snap-align: start;
}

.cv-trigger__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .cv-trigger {
    height: 90vh;
  }
}
</style>

<style>
.cv-card {
  --cv-card-bg: var(--vp-c-bg-elv, #ffffff);
  --cv-card-fg: var(--vp-c-text-1, #213547);
  --cv-card-muted: var(--vp-c-text-2, #67737e);
  --cv-card-accent: var(--vp-c-brand-1, #2bcf62);
  --cv-card-border: var(--vp-c-divider, rgba(60, 60, 60, 0.18));

  font-family: var(--vp-font-family-base, system-ui, sans-serif);
  pointer-events: none;
}

.cv-card__inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0.35;
  transform: scale(0.78);
  transform-origin: bottom center;
  transition: opacity 0.45s ease, transform 0.45s ease, filter 0.45s ease;
  filter: saturate(0.5);
  will-change: transform, opacity;
}

.cv-card__body {
  background: var(--cv-card-bg);
  color: var(--cv-card-fg);
  border: 1px solid var(--cv-card-border);
  border-radius: 14px;
  padding: 10px 14px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  max-width: 260px;
  min-width: 180px;
  text-align: left;
  line-height: 1.35;
}

.cv-card__date {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--cv-card-accent);
}

.cv-card__title {
  font-size: 14px;
  font-weight: 700;
  margin-top: 2px;
  color: var(--cv-card-fg);
}

.cv-card__org {
  font-size: 13px;
  margin-top: 2px;
  color: var(--cv-card-fg);
}

.cv-card__pin {
  width: 14px;
  height: 14px;
  margin-top: -1px;
  border-radius: 50%;
  background: var(--cv-card-accent);
  border: 3px solid var(--cv-card-bg);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.cv-card__inner::before {
  content: '';
  position: absolute;
  bottom: 12px;
  width: 2px;
  height: 14px;
  background: var(--cv-card-accent);
  opacity: 0.7;
}

.cv-card--active {
  z-index: 5;
}

.cv-card--active .cv-card__inner {
  opacity: 1;
  transform: scale(1);
  filter: saturate(1);
}

.cv-card--active .cv-card__body {
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
}

.cv-card--active .cv-card__pin {
  width: 18px;
  height: 18px;
  box-shadow: 0 0 0 6px rgba(43, 207, 98, 0.22), 0 2px 8px rgba(0, 0, 0, 0.35);
}

@media (max-width: 640px) {
  .cv-card__body {
    max-width: 220px;
    min-width: 150px;
    padding: 8px 11px;
  }
  .cv-card__title { font-size: 13px; }
  .cv-card__org { font-size: 12px; }
  .cv-card__date { font-size: 10px; }
}
</style>
