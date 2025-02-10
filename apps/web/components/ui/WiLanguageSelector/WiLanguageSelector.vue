<template>
  <div class="relative">
  <div v-if="localeCodes.length > 1" class="relative">
    <button class="dropdown-btn flex items-center border border-gray-300 bg-white px-2 py-1 rounded-md hover:bg-gray-100" @click="toggleDropdown">
      <div class="flag-icon w-5 h-4" v-html="flagList[currentLocale]" />
      <svg class="chevron-icon w-4 h-4 ml-1 transition-transform duration-200" :class="{ 'rotate-180': isOpen }"
           xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd" />
      </svg>
    </button>

    <ul v-if="isOpen" class="absolute right-0 mt-1 w-32 bg-white border border-gray-300 shadow-lg rounded-md z-50 text-sm">
      <li v-for="locale in localeCodes" :key="locale" class="dropdown-item flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100"
          @click="selectLanguage(locale)">
        <div class="flag-icon w-5 h-4 mr-2" v-html="flagList[locale]" />
        <span>{{ $t(`lang.${locale}`) }}</span>
      </li>
    </ul>
  </div>
 </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useLocalization } from "@/composables/useLocalization";
import { flagImports } from "../../LanguageSelector/flags";

const { switchLocale } = useLocalization();
const { localeCodes, locale: currentLocale } = useI18n();

const isOpen = ref(false);
const flagList: { [key: string]: string } = {};

localeCodes.value.forEach((locale) => {
  flagList[locale] = flagImports[locale] ?? "";
});

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const closeDropdown = (event: Event) => {
  if (!(event.target as HTMLElement).closest(".dropdown-btn")) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", closeDropdown);
});

onUnmounted(() => {
  document.removeEventListener("click", closeDropdown);
});

const selectLanguage = (locale: string) => {
  switchLocale(locale);
  isOpen.value = false;
};

</script>

<style scoped>
.rotate-180 {
  transform: rotate(180deg);
}

.dropdown-item span {
  cursor: pointer;
}

</style>