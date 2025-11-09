<template>
  <div id="map-page">
    <div id="map"></div>
    <div id="steps">
      <div class="step"></div>
      <div class="step"></div>
    </div>
  </div>
</template>
  
<script setup>
  import { onMounted, onUnmounted } from 'vue'
  import maplibregl from 'maplibre-gl'
  import scrollama from 'scrollama'
  
  onMounted(() => {
    const locParliament = [19.04556, 47.50704]
    const locCastle = [19.03945, 47.49621]
    const zoomStart = 15
    const zoomEnd = 17
  
    const map = new maplibregl.Map({
      container: 'map',
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: locParliament,
      zoom: zoomStart
    })
  
    // Disable map interactions in order not to interfere with scrollytelling
    map.scrollZoom.disable()
    map.boxZoom.disable()
    map.dragRotate.disable()
    map.dragPan.disable()
    map.keyboard.disable()
    map.doubleClickZoom.disable()
    map.touchZoomRotate.disable()
  
    map.once('idle', () => {
      map.setCenter(locParliament)
      map.setZoom(zoomStart)
  
      const card1 = document.createElement('div')
      card1.className = 'marker-card'
      card1.innerHTML = '<img src="" alt="Parliament"><p>Hungarian Parliament</p>'
  
      const card2 = document.createElement('div')
      card2.className = 'marker-card'
      card2.innerHTML = '<img src="" alt="Castle"><p>Buda Castle</p>'
  
      const marker1 = new maplibregl.Marker(card1, { offset: [0, -75] })
        .setLngLat(locParliament)
        .addTo(map)
      const marker2 = new maplibregl.Marker(card2, { offset: [0, -75] })
        .setLngLat(locCastle)
        .addTo(map)
  
      card2.style.opacity = 0
  
      const scroller = scrollama()
      scroller
        .setup({ step: '.step', offset: 0.5, progress: true })
        .onStepProgress(resp => {
          if (resp.index === 0) {
            const t = Math.max(0, Math.min(1, resp.progress))
            const lng = locParliament[0] + (locCastle[0] - locParliament[0]) * t
            const lat = locParliament[1] + (locCastle[1] - locParliament[1]) * t
            const zoom = zoomStart + (zoomEnd - zoomStart) * t
  
            map.easeTo({
              center: [lng, lat],
              zoom,
              duration: 100,
              easing: n => n
            })
  
            card1.style.opacity = 1 - t
            card2.style.opacity = t
          }
        })
        .onStepEnter(resp => {
          if (resp.index === 1) {
            map.easeTo({
              center: locCastle,
              zoom: zoomEnd,
              duration: 800,
              easing: n => n
            })
            card1.style.opacity = 0
            card2.style.opacity = 1
          }
        })
  
      window.addEventListener('resize', scroller.resize)
    })
  
    onUnmounted(() => {
      map.remove()
    })
  })
</script>
  
<style>
  #map-page {
    margin: 0;
    padding: 0;
  }
  #map {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }
  #steps {
    position: relative;
    z-index: 1;
  }
  .step {
    height: 100vh;
  }
  .marker-card {
    background: white;
    border: 1px solid #666;
    border-radius: 4px;
    padding: 8px;
    font-family: sans-serif;
    font-size: 14px;
    max-width: 200px;
    text-align: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    transition: opacity 0.4s ease;
  }
  .marker-card img {
    width: 100%;
    height: auto;
    display: block;
    margin-bottom: 5px;
  }
</style>
