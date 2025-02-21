<template>
  <div>
    <WiHeaderContainer
      :homepage-data="homepageData"
      :header-config-data="headerConfigData"
      :breadcrumbs="breadcrumbs"
      :is-open="isOpen"
      :product="product"
    />

    <div ref="content" class="content">
      <NarrowContainer v-if="breadcrumbs?.length" class="p-4 md:px-0">
        <LazyUiBreadcrumbs :breadcrumbs="breadcrumbs" />
      </NarrowContainer>
      <main>
        <slot />
      </main>
    </div>

    <UiNavbarBottom v-if="viewport.isLessThan('lg')" />
    <Cookiebar />
    <PreviewMode />
    <NuxtLazyHydrate when-visible>
      <UiFooter />
    </NuxtLazyHydrate>
    <QuickCheckout v-if="isOpen" :product="product" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { DefaultLayoutProps } from '~/layouts/types';
import WiHeaderContainer from "~/components/ui/WiHeaderWrapper/WiHeaderWrapper.vue";
import { useCategoryData } from "~/composables/useCategoryData/useCategoryData";

const { homepageData } = useCategoryData(45);
const { homepageData: headerConfigData } = useCategoryData(99);

const isOpen = ref<boolean>(false);
const product = ref<null | any>(null);
const viewport = useViewport();

defineProps<DefaultLayoutProps>();
const { setLogoMeta } = useStructuredData();
setLogoMeta();
</script>

