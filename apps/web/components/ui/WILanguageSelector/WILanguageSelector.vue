<template>
  <div v-if="localeCodes.length > 1" class="relative">
    <UiButton
      v-if="!isLanguageSelectOpen"
      class="group relative text-white hover:text-white active:text-white hover:bg-primary-800 active:bg-primary-700 mr-1 -ml-0.5 rounded-md cursor-pointer"
      :aria-label="t('languageSelector')"
      variant="tertiary"
      square
      data-testid="open-languageselect-button"
      :disabled="(showConfigurationDrawer && isEditing) || (showConfigurationDrawer && disableActions)"
      @click="toggleLanguageSelect"
    >
      <template #prefix>
        <SfIconLanguage class="relative" />
      </template>
    </UiButton>
    <div
      v-if="isLanguageSelectOpen"
      class="absolute top-full mt-2 bg-white shadow-lg rounded-md w-32 z-50"
    >
      <button
        v-for="locale in localeCodes"
        :key="locale.code"
        @click="setLanguage(locale.code)"
        class="flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-gray-100"
      >
        <span>{{ locale.label }}</span>
        <img
          v-if="locale.flag"
          :src="locale.flag"
          :alt="locale.label"
          class="w-5 h-3 rounded"
        />
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    localeCodes: {
      type: Array,
      default: () => [
        { code: "de", label: "Deutsch", flag: "/flags/de.png" },
        { code: "en", label: "English", flag: "/flags/en.png" },
      ],
    },
  },
  data() {
    return {
      isLanguageSelectOpen: false,
    };
  },
  methods: {
    toggleLanguageSelect() {
      this.isLanguageSelectOpen = !this.isLanguageSelectOpen;
    },
    setLanguage(code) {
      console.log("Sprache gewechselt zu:", code);
      this.isLanguageSelectOpen = false;
    },
  },
};
</script>
