<template>
  <client-only>
    <CountDown :timerConfig="JSON.stringify(countdownData)" />
  </client-only>
  <Body class="font-body" :class="bodyClass" />
  <UiNotifications />
  <VitePwaManifest v-if="$pwa?.isPWAInstalled" />
  <NuxtLoadingIndicator
    color="repeating-linear-gradient(to right, #008ebd 0%,#80dfff 50%,#e0f7ff 100%)"
  />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <client-only>
    <WhatsappFloatingButton phoneNumber="+49 176 22573566" message="Hallo, " />

    <Popup
      :showOnce="true"
      localStorageKey="my-special-popup"
      :closeOnBackdropClick="false"
      imageUrl="https://images.pexels.com/photos/15153910/pexels-photo-15153910/free-photo-of-an-armchair-in-a-room.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
      text="<p class='text-3xl font-bold pb-16'>Modal Component!</p><p class='pb-5'>This is a simple modal plugin.</p><p class='max-w-lg text-1xl font-semibold leading-normal text-gray-900'>Implement this in your shop and more ! With us.</p>"
    />
  </client-only>
</template>

<script setup lang="ts">
const { $pwa } = useNuxtApp();
const bodyClass = ref("");
const { getCategoryTree } = useCategoryTree();
const { setInitialDataSSR } = useInitialSetup();
const { setVsfLocale } = useLocalization();
const route = useRoute();
const { locale } = useI18n();
const { setStaticPageMeta } = useCanonical();

await setInitialDataSSR();
setVsfLocale(locale.value);

const countdownData = {
  enableTitle: true,
  title: "Counter mit custom konfiguration nur mit webimpact!",
  startDate: "2025-01-01T00:00:00Z",
  endDate: "2025-03-01T12:00:00Z",
};

if (route?.meta.pageType === "static") setStaticPageMeta();
usePageTitle();

onNuxtReady(async () => {
  bodyClass.value = "hydrated"; // Need this class for cypress testing
});

watch(
  () => locale.value,
  async (locale: string) => {
    setVsfLocale(locale);
    await getCategoryTree();
  }
);
</script>
