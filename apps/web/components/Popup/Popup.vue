<template>
  <!-- Popup Overlay -->
  <div 
    v-if="isVisible" 
    class="fixed inset-0 z-50 bg-neutral-500/50 flex items-center justify-center" 
    @click="onBackgroundClick"
  >
    <!-- Stop propagation so clicking inside doesn’t close -->
    <div 
      class="relative bg-white w-full max-w-screen-md mx-auto flex flex-col md:flex-row shadow-md rounded-md overflow-hidden" 
      @click.stop
    >
      <!-- Close Button (top-right) -->
      <button 
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold" 
        @click="closePopup"
      >
        &times;
      </button>

      <!-- If both image and text are present -->
      <template v-if="hasBoth">
        <!-- Image side (desktop) / top (mobile) -->
        <div class="md:w-1/2 w-full">
          <img
            :src="imageUrl"
            alt="Popup Image"
            class="w-full h-auto object-cover"
          />
        </div>
        <!-- Text side (desktop) / bottom (mobile) -->
        <div class="md:w-1/2 w-full p-4" v-html="textHtml"></div>
      </template>

      <!-- If only image is present, full width -->
      <template v-else-if="hasOnlyImage">
        <img
          :src="imageUrl"
          alt="Popup Image"
          class="w-full h-auto object-cover"
        />
      </template>

      <!-- If only text is present, full width -->
      <template v-else-if="hasOnlyText">
        <div class="w-full p-4" v-html="textHtml"></div>
      </template>

      <!-- If neither image nor text -->
      <template v-else>
        <div class="w-full p-4 text-center">
          <p>No image or text provided.</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, defineProps } from 'vue';

/**
 * Props:
 *   - imageUrl? = optional image URL
 *   - text? = optional HTML string
 *   - showOnce? = whether to store in localStorage so popup doesn't appear again
 *   - localStorageKey? = custom key to store the "dismissed" state
 *   - closeOnBackdropClick? = whether clicking outside the popup closes it
 */
const props = defineProps<{
  imageUrl?: string;
  text?: string;
  showOnce?: boolean;
  localStorageKey?: string;
  closeOnBackdropClick?: boolean;
}>();

// Internal boolean to control if the popup is visible
const isVisible = ref(true);

const storageKey = computed(() => props.localStorageKey || 'popup-dismissed');

const hasImage = computed(() => !!props.imageUrl);
const hasText = computed(() => !!props.text);
const hasBoth = computed(() => hasImage.value && hasText.value);
const hasOnlyImage = computed(() => hasImage.value && !hasText.value);
const hasOnlyText = computed(() => hasText.value && !hasImage.value);

const textHtml = computed(() => props.text || '');

// On mount, if showOnce is enabled and localStorage says user closed it, hide immediately
onMounted(() => {
  if (props.showOnce) {
    const wasDismissed = localStorage.getItem(storageKey.value);
    if (wasDismissed === 'true') {
      isVisible.value = false;
    }
  }
});

/** 
 * Close the popup:
 *   1) Hide it
 *   2) If showOnce, write to localStorage
 */
function closePopup() {
  isVisible.value = false;
  if (props.showOnce) {
    localStorage.setItem(storageKey.value, 'true');
  }
}

/**
 * If user clicks the backdrop, optionally close the popup 
 * (Only if closeOnBackdropClick = true)
 */
function onBackgroundClick() {
  if (props.closeOnBackdropClick) {
    closePopup();
  }
}
</script>

