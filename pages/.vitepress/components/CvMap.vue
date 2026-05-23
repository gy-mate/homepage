<script src="./CvMap.js"></script>

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
        <span class="cv-trigger__sr">{{ formatDateRange(item.from_date, item.to_date) }} – {{ item.job_title }}, {{ item.organization }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped src="./CvMap.scoped.css"></style>
<style src="./CvMap.css"></style>
