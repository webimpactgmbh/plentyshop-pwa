<template>
  <div>
    <div
      ref="headerBar"
      class="header-bar w-full z-50 transition-all duration-500 ease-in-out"
      :class="[{
        'bg-white-header': !isTransparent,
        'bg-transparent-header': isTransparent,
        'fixed top-0 left-0': isSticky,
        'mb-8': isSticky }]">
      <div ref="headerContent" class="transition-all duration-500 ease-in-out">
        <div
          v-if="showPromoBar"
          class="promo-bar relative transition-all duration-500 ease-in-out max-h-14 opacity-100 pointer-events-auto"
        >
          <WiPromoBar :promo-messages="homepageData?.promoMessages || []" :is-transparent="isTransparent"/>
          <Suspense>
            <component :is="headerComponentRef" v-if="headerComponentRef" :is-transparent="isTransparent" />
          </Suspense>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, markRaw, watchEffect, onMounted, onUnmounted } from "vue";
import WiPromoBar from "~/components/ui/WiPromoBar/WiPromoBar.vue";

const props = defineProps({
  homepageData: Object,
  headerConfigData: Object,
});

// Use shallowRef for component references
const headerComponentRef = shallowRef<any>(null);
const showPromoBar = ref<boolean>(true);
const isSticky = ref<boolean>(true);
const isTransparent = ref<boolean>(true);

// Async component loading function
const loadHeaderComponent = async (type: string) => {
  let component;
  switch (type) {
    case "header_top":
      component = await import("~/components/ui/WiHeader/WiHeaderTop/WiHeaderTop.vue");
      break;
    case "header_bottom":
      component = await import("~/components/ui/WiHeader/WiHeaderBottom/WiHeaderBottom.vue");
      break;
    default:
    // component = await import("~/components/ui/WiHeader/WiHeaderTop/WiHeaderTop.vue");
     component = await import("~/components/ui/WiHeader/WiHeaderBottom/WiHeaderBottom.vue");

  }
  return markRaw(component.default);
};

watchEffect(async () => {
  const headerType = props.headerConfigData?.headerType || "default";
  isSticky.value = props.headerConfigData?.isSticky !== false;

  try {
    headerComponentRef.value = await loadHeaderComponent(headerType);
  } catch (error) {
    console.error("Error loading header component:", error);
  }
});

const handleScroll = () => {
  if (isSticky.value) {
    isTransparent.value = window.scrollY < 10;
  }
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped>
.promo-bar {
  overflow: visible;
  position: relative;
}

.promo-bar.max-h-14 {
  max-height: 3.5rem;
  opacity: 1;
  pointer-events: auto;
}

.header-bar.fixed {
  position: fixed;
}

</style>