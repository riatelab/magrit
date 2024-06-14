<script setup>
  import { withBase } from 'vitepress';
  import { onMounted, ref } from 'vue';
  import mediumZoom from 'medium-zoom';

  defineProps({
    src: String,
    alt: String,
    caption: String,
  });

  const imgRef = ref(null);

  onMounted(() => {
    mediumZoom(
        imgRef.value,
        { background: 'var(--vp-c-bg)' },
    );
  });
</script>

<template>
  <div style="text-align: center;">
    <br>
    <img ref="imgRef" :src="withBase(src)" :alt="alt" style="margin: auto;" />
    <i>{{ caption }}</i>
  </div>
</template>

<style>
.medium-zoom-overlay {
  z-index: 1000;
  opacity: 0.75 !important;
}
.medium-zoom-image {
  z-index: 1001;
}
</style>