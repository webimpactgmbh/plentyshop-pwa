<template>
  <form ref="referenceRef" role="search" class="relative" @submit.prevent="handleSubmit">
    <SfInput
      ref="inputReference"
      v-model="inputModel"
      :aria-label="t('search')"
      id="search-bar"
      :placeholder="t('search')"
      @focus="open"
    >
      <template #prefix>
        <SfLoaderCircular v-if="loading" />

        <svg
          v-else
          width="26"
          height="26"
          viewBox="0 0 26 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.75 22.75L18.9583 18.9583M18.4167 10.8333C18.4167 15.0215 15.0215 18.4167 10.8333 18.4167C6.64517 18.4167 3.25 15.0215 3.25 10.8333C3.25 6.64517 6.64517 3.25 10.8333 3.25C15.0215 3.25 18.4167 6.64517 18.4167 10.8333Z"
            stroke="#111928"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </template>
      <template #suffix>
        <button
          v-if="inputModel"
          type="button"
          aria-label="Reset search"
          class="flex rounded-md focus-visible:outline focus-visible:outline-offset"
          @click="handleReset"
        >
          <SfIconCancel />
        </button>
      </template>
    </SfInput>
  </form>
</template>

<script setup lang="ts">
import {
  SfIconCancel,
  SfIconSearch,
  SfInput,
  useDisclosure,
  SfLoaderCircular,
} from "@storefront-ui/vue";
import { unrefElement } from "@vueuse/core";

const props = defineProps<{
  close?: () => boolean;
}>();

const localePath = useLocalePath();
const { t } = useI18n();
const router = useRouter();
const { open } = useDisclosure();
const { updateSearchTerm } = useCategoryFilter();
const { loading } = useSearch();

const inputModel = ref("");
const inputReference = ref<HTMLSpanElement>();
const handleInputFocus = () => {
  const inputElement = unrefElement(inputReference)?.querySelector("input");
  inputElement?.focus();
};
const handleReset = () => {
  inputModel.value = "";
  handleInputFocus();
};
const handleSubmit = () => {
  props.close?.();
  updateSearchTerm(inputModel.value);
  router.push({ path: localePath(paths.search), query: { term: inputModel.value } });
  handleReset();
};

watch(inputModel, () => {
  if (inputModel.value === "") {
    handleReset();
  }
});
</script>
