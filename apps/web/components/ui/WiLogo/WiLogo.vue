<template>
  <picture>
    <template v-if="imageExtension === 'svg'">
      <NuxtImg
        ref="logo"
        :src="imagePath"
        :alt="`${{ storeName }} logo`"
        class="w-[100px] h-[50px] sm:w-[140px] sm:h-[70px] md:w-[140px] md:h-[93px] py-2"
        width="187"
        height="93"
        preload
      />
    </template>
    <template v-else>
      <img
        id="logo"
        ref="logo"
        :src="imagePath"
        :alt="`${{ storeName }} logo`"
        :width="imgWidth"
        :height="imgHeight"
        class="max-w-[150px] max-h-[70px] sm:max-w-[187px] sm:max-h-[93px]"
        preload
      />
    </template>
  </picture>
</template>

<script setup lang="ts">
const runtimeConfig = useRuntimeConfig();
const storeName = runtimeConfig.public.storeName;
const imageExtension = runtimeConfig.public.headerLogo.split('.').pop();
const imagePath = runtimeConfig.public.headerLogo;
const logo = ref<HTMLImageElement | null>(null);
const imgWidth = ref<string>('187');
const imgHeight = ref<string>('93');
console.log(runtimeConfig.public.headerLogo);
onMounted(() => {
  if (logo.value) {
    imgWidth.value = logo.value.clientWidth + '';
    imgHeight.value = logo.value.clientHeight + '';
  }
});
</script>
