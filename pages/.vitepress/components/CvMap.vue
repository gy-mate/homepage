<script src="./CvMap.js"></script>

<template>
  <div class="cv-scroll">
    <div ref="mapContainer" class="cv-map" aria-hidden="true"></div>
    <div ref="triggers" class="cv-triggers">
      <div
        v-for="(_location, index) in locations"
        :key="index"
        class="cv-trigger"
      ></div>
    </div>
    <div ref="indexContent" class="cv-index-content" aria-hidden="true">
      <slot />
    </div>
  </div>
</template>

<style scoped src="./CvMap.scoped.css"></style>
<style src="./CvMap.css"></style>
