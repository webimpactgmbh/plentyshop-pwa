<template>
  <div class="promo-bar">
    <div class="promo-content">
      <span @click="navigateBack" class="arrow">←</span>
      <transition name="fade" mode="out-in">
        <span :key="currentMessageIndex" class="promo-text">{{ promoMessages[currentMessageIndex] }}</span>
      </transition>
      <span @click="navigateForward" class="arrow">→</span>
    </div>

    <!--TODO make language button appear to do the right, and remove old one-->
    <div v-if="localeCodes.length > 1">
      <UiButton
        class="group relative text-white hover:text-white active:text-white hover:bg-primary-800 active:bg-primary-700 mr-1 -ml-0.5 rounded-md cursor-pointer"
        variant="tertiary"
        square
        data-testid="open-languageselect-button"
        @click="toggleLanguageSelect"
      >
        <template #prefix>
          <SfIconLanguage class="relative" />
        </template>
      </UiButton>
      <UiModal v-model="isLanguageSelectOpen" tag="section" class="!p-0 !pt-2.5 flex flex-col !w-11/12">
        <template v-for="locale in localeCodes" :key="locale.code">
          <LanguageButton
            :locale="locale.code"
            variant="tertiary"
            class="mx-3 mb-2 flex items-center justify-between !text-black"
            @click="setLanguage(locale.code)"
          >
            <div class="flex">
              <div class="mr-2 w-8" :data-testid="`flagIcon-${locale.code}`" v-html="flagList[locale.code]" />
              <div class="!text-black-500">{{ locale.label }}</div>
            </div>
            <SfIconCheck v-if="locale.code === currentLocale" class="text-green-500" />
          </LanguageButton>
        </template>
      </UiModal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SfIconLanguage, SfIconCheck } from "@storefront-ui/vue";
import { ref, onMounted, onUnmounted } from "vue";

// 📌 Sprachumschaltung
const isLanguageSelectOpen = ref(false);
const localeCodes = ref([
  { code: "de", label: "Deutsch", flag: "/flags/de.png" },
  { code: "en", label: "English", flag: "/flags/en.png" },
]);
const currentLocale = ref("de");

const flagList: { [key: string]: string } = {};
localeCodes.value.forEach((locale) => {
  flagList[locale.code] = `<img src="${locale.flag}" alt="${locale.label}" class="w-6 h-4 rounded"/>`;
});

//TODO: get variable content from plentyOne
const promoMessages = ref([
  "50% Rabatt auf alle Produkte!",
  "Kostenloser Versand für Bestellungen über 50€!",
  "Jetzt anmelden und 10€ Willkommensrabatt sichern!",
  "Ratenzahlung jetzt verfügbar!",
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
  currentMessageIndex.value =
    (currentMessageIndex.value - 1 + promoMessages.value.length) % promoMessages.value.length;
};

const navigateForward = () => {
  currentMessageIndex.value = (currentMessageIndex.value + 1) % promoMessages.value.length;
};

const toggleLanguageSelect = () => {
  isLanguageSelectOpen.value = !isLanguageSelectOpen.value;
  if (isLanguageSelectOpen.value) {
    stopAutoSlide();
  } else {
    startAutoSlide();
  }
};

const setLanguage = (locale: string) => {
  console.log("Sprache gewechselt zu:", locale);
  currentLocale.value = locale;
  isLanguageSelectOpen.value = false;
};

onMounted(() => {
  startAutoSlide();
});

onUnmounted(() => {
  stopAutoSlide();
});
</script>

<style scoped>
.promo-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
  padding: 8px 16px;
  border-radius: 12px;
  min-height: 40px;
}

.promo-content {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #666;
  min-width: 600px;
  justify-content: center;
  text-align: center;

}

.promo-text {
  flex-grow: 1;
  text-align: center;
  font-weight: bold;
  padding: 0 10px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.arrow {
  cursor: pointer;
  font-weight: bold;
  padding: 4px 6px;
}
</style>
