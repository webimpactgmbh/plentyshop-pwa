<template>
  <div class="promo-bar flex items-center justify-between bg-gray-200 px-4 py-2 rounded-lg w-full">
    <div class="promo-content relative flex items-center justify-between w-full max-w-[600px] mx-auto">
      <span @click="navigateBack" class="arrow absolute left-0 inset-y-0 flex items-center justify-center w-10 text-gray-500 hover:text-gray-700 text-lg cursor-pointer">
        ←
      </span>
      <div class="promo-text-wrapper flex justify-center items-center px-12 w-full text-center">
        <transition name="fade" mode="out-in">
          <span :key="currentMessageIndex" class="promo-text font-medium text-gray-700 text-sm md:text-base">
            {{ promoMessages[currentMessageIndex] }}
          </span>
        </transition>
      </div>
      <span @click="navigateForward" class="arrow absolute right-0 inset-y-0 flex items-center justify-center w-10 text-gray-500 hover:text-gray-700 text-lg cursor-pointer">
        →
      </span>
    </div>
    <WILanguageSelector/>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import WILanguageSelector from '~/components/ui/WILanguageSelector/WILanguageSelector.vue';

const promoMessages = ref([
  "50% Rabatt auf alle Produkte!",
  "Kostenloser Versand für Bestellungen über 50€!",
  "Jetzt anmelden und 10€ Willkommensrabatt sichern!",
  "Ratenzahlung jetzt verfügbar!"
]);
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
  currentMessageIndex.value = (currentMessageIndex.value - 1 + promoMessages.value.length) % promoMessages.value.length;
};

const navigateForward = () => {
  currentMessageIndex.value = (currentMessageIndex.value + 1) % promoMessages.value.length;
};

onMounted(() => {
  startAutoSlide();
});

onUnmounted(() => {
  stopAutoSlide();
});
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
