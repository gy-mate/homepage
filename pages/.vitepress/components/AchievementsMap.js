import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  addCardMarker,
  collectEntries,
  currentStyleUrl,
  loadStyle,
  watchThemeStyle,
} from './Map.js'

const FALLBACK_CENTER = [19.040236, 47.497913]
const FALLBACK_ZOOM = 7
const FIT_BOUNDS_PADDING = 80

export default {
  setup() {
    const mapContainer = ref(null)
    const indexContent = ref(null)
    const map = shallowRef(null)
    const markers = []
    let themeObserver = null

    onMounted(async () => {
      const entries = collectEntries(indexContent.value)
      const firstEntry = entries[0]

      map.value = new maplibregl.Map({
        container: mapContainer.value,
        style: await loadStyle(currentStyleUrl()),
        center: firstEntry
          ? [firstEntry.longitude, firstEntry.latitude]
          : FALLBACK_CENTER,
        zoom: firstEntry ? firstEntry.map_zoom_level ?? FALLBACK_ZOOM : FALLBACK_ZOOM,
        attributionControl: { compact: true },
      })
      map.value.addControl(new maplibregl.NavigationControl(), 'top-right')

      themeObserver = watchThemeStyle(map)

      map.value.on('load', () => {
        entries.forEach((item) => {
          markers.push(addCardMarker(map.value, item))
        })

        if (entries.length > 1) {
          const bounds = new maplibregl.LngLatBounds()
          entries.forEach((item) => bounds.extend([item.longitude, item.latitude]))
          map.value.fitBounds(bounds, { padding: FIT_BOUNDS_PADDING })
        }
      })
    })

    onBeforeUnmount(() => {
      themeObserver?.disconnect()
      markers.length = 0
      map.value?.remove()
    })

    return { mapContainer, indexContent }
  },
}
