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
    const loc1 = [19.04556, 47.50694];    // Parliament
    const loc2 = [19.03945, 47.49621];    // Buda Castle

    const zoom1 = 15, zoom2 = 17;

    const map = new maplibregl.Map({
      container: 'map',
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: loc1,
      zoom: zoom1
    });

    // Disable map interactions in order not to interfere with scrollytelling
    map.scrollZoom.disable();
    map.boxZoom.disable();
    map.dragRotate.disable();
    map.dragPan.disable();
    map.keyboard.disable();
    map.doubleClickZoom.disable();
    map.touchZoomRotate.disable();

    map.on('load', () => {
      // Create two marker cards
      const card1 = document.createElement('div');
      card1.className = 'marker-card';
      card1.innerHTML = '<img src="" alt="Image 1"><p>First location description.</p>';

      const card2 = document.createElement('div');
      card2.className = 'marker-card';
      card2.innerHTML = '<img src="" alt="Image 2"><p>Second location description.</p>';

      const marker1 = new maplibregl.Marker(card1, { offset: [0, -75] })
        .setLngLat(loc1)
        .addTo(map);

      const marker2 = new maplibregl.Marker(card2, { offset: [0, -75] })
        .setLngLat(loc2)
        .addTo(map);

      // Initially hide second marker
      card2.style.opacity = 0;

      const scroller = scrollama();

      scroller
        .setup({
          step: ".step",
          offset: 0.5,
          progress: true
        })
        .onStepEnter(response => {
          if (response.index === 0) {
            card1.style.opacity = 1;
            card2.style.opacity = 0;
          }
          if (response.index === 1) {
            card1.style.opacity = 0;
            card2.style.opacity = 1;
          }
        })
        .onStepProgress(response => {
          // Interpolate camera between loc1 and loc2
          const t = Math.min(Math.max(response.progress, 0), 1);
          const lng = loc1[0] + (loc2[0] - loc1[0]) * t;
          const lat = loc1[1] + (loc2[1] - loc1[1]) * t;
          const zoom = zoom1 + (zoom2 - zoom1) * t;

          map.easeTo({
            center: [lng, lat],
            zoom: zoom,
            duration: 100,
            easing: n => n // linear for smoother interpolation
          });

          // Fade cards gradually
          card1.style.opacity = 1 - t;
          card2.style.opacity = t;
        });

      window.addEventListener('resize', scroller.resize);
    });
  
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
