<template>
  <div>
    <WIPromoBar :promo-messages="homepageData?.promoMessages || []" />
    <WISimplifiedHeader/>
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
import type { DefaultLayoutProps } from '~/layouts/types';
import WISimplifiedHeader from '~/components/ui/WISimplifiedHeader/WISimplifiedHeader.vue';
import WIPromoBar from '~/components/ui/WIPromoBar/WIPromoBar.vue';
import { useCategoryData } from "~/composables/useCategoryData/useCategoryData";

const { homepageData } = useCategoryData(45);

defineProps<DefaultLayoutProps>();
const { setLogoMeta } = useStructuredData();
const { isOpen, product } = useQuickCheckout();
const viewport = useViewport();
setLogoMeta();
</script>
