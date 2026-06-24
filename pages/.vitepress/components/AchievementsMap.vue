<script src="./AchievementsMap.js"></script>

<template>
  <div class="achievements-map-wrap">
    <div ref="mapContainer" class="achievements-map"></div>
    <div ref="indexContent" class="achievements-index-content" aria-hidden="true">
      <slot />
    </div>
  </div>
</template>

<style scoped src="./AchievementsMap.scoped.css"></style>
<style src="./Map.css"></style>
