<template>
  <div>
    <WIPromoBar :promo-messages="homepageData?.promoMessages || []" />
    <component :is="headerComponent" v-if="headerComponent" />
    <NarrowContainer v-if="breadcrumbs?.length" class="p-4 md:px-0">
      <LazyUiBreadcrumbs :breadcrumbs="breadcrumbs" />
    </NarrowContainer>
    <main>
      <slot />
    </main>
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
import { ref, defineAsyncComponent, watchEffect } from "vue";
import type { DefaultLayoutProps } from '~/layouts/types';
import WIPromoBar from '~/components/ui/WIPromoBar/WIPromoBar.vue';
import { useCategoryData } from "~/composables/useCategoryData/useCategoryData";
const { homepageData } = useCategoryData(45);
const { homepageData: headerConfigData } = useCategoryData(99);

const headerComponent = ref<null | any>(null);

watchEffect(() => {
  //TODO: get values from config
  const headerType = headerConfigData.value?.headerType || "default";

  switch (headerType) {
    case "header_top":
      headerComponent.value = defineAsyncComponent(() => import("~/components/ui/WIHeader/WIHeaderTop/WiHeaderTop.vue"));
      break;
    case "header_bottom":
      headerComponent.value = defineAsyncComponent(() => import("~/components/ui/WIHeader/WiHeaderBottom/WiHeaderBottom.vue"));
      break;
    default:
      headerComponent.value = defineAsyncComponent(() => import("~/components/ui/WIHeader/WIHeaderTop/WiHeaderTop.vue"));
  }
});

defineProps<DefaultLayoutProps>();
const { setLogoMeta } = useStructuredData();
const { isOpen, product } = useQuickCheckout();
const viewport = useViewport();
setLogoMeta();
</script>
