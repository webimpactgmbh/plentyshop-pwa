<template>
  <div class="promo-bar flex items-center justify-between px-4 py-1 w-full rounded-b-[15px]"
       :class="[{ 'bg-gray-200': !isTransparent, 'bg-opacity': isTransparent }]">
    <div class="promo-content relative flex items-center justify-between w-full max-w-[600px] mx-auto">
      <span
        @click="navigateBack"
        class="arrow absolute left-0 inset-y-0 flex items-center justify-center w-10 hover:text-gray-700 text-lg cursor-pointer"
        :class="[{ 'text-gray-500': !isTransparent, 'text-gray-300': isTransparent }]" ><
      </span>
      <div class="promo-text-wrapper flex justify-center items-center px-12 w-full text-center">
        <transition name="fade" mode="out-in">
          <span :key="currentMessageIndex" class="promo-text font-medium  text-sm md:text-base"
                :class="[{ 'text-gray-500': !isTransparent, 'text-gray-300': isTransparent }]" >
            {{ displayedMessages[currentMessageIndex] }}
          </span>
        </transition>
      </div>
      <span
        @click="navigateForward"
        class="arrow absolute right-0 inset-y-0 flex items-center justify-center w-10 hover:text-gray-700 text-lg cursor-pointer"
        :class="[{ 'text-gray-500': !isTransparent, 'text-gray-300': isTransparent }]" >>
      </span>
    </div>
    <WILanguageSelector/>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import WILanguageSelector from '~/components/ui/WiLanguageSelector/WiLanguageSelector.vue';

const props = defineProps<{
  promoMessages: string[];
  isTransparent?: boolean;
}>();

const defaultMessages = [
  "initial: test1",
  "initial: test2",
];

const displayedMessages = computed(() => props.promoMessages.length > 0 ? props.promoMessages : defaultMessages);

const currentMessageIndex = ref(0);
let intervalId: number | null = null;

const startAutoSlide = () => {
  intervalId = window.setInterval(() => {
    navigateForward();
  }, 5000);
};

const stopAutoSlide = () => {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

const navigateBack = () => {
  currentMessageIndex.value =
    (currentMessageIndex.value - 1 + displayedMessages.value.length) % displayedMessages.value.length;
};

const navigateForward = () => {
  currentMessageIndex.value =
    (currentMessageIndex.value + 1) % displayedMessages.value.length;
};

onMounted(() => {
  startAutoSlide();
});

onUnmounted(() => {
  stopAutoSlide();
});

watch(() => props.promoMessages, () => {
  currentMessageIndex.value = 0;
});
</script>
<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.bg-gray-200 {
  background: #e5e7eb;
}

</style>

