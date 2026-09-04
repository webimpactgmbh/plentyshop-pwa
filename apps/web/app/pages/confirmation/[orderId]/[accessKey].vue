<template>
  <div v-if="loading || initialLoadPending" class="flex justify-center py-20">
    <SfLoaderCircular size="2xl" />
  </div>
  <template v-else-if="data">
    <ConfirmationPageContent :order="data" />
  </template>
  <template v-else-if="error">
    <SoftLogin :error="error" @submit="tryLoadAfterSoftLogin" />
  </template>
</template>

<script setup lang="ts">
import { SfLoaderCircular } from '@storefront-ui/vue';
import type { OrderSearchParams } from '@plentymarkets/shop-api';
import type { Locale } from '#i18n';

defineI18nRoute({
  locales: process.env.LANGUAGELIST?.split(',') as Locale[],
});

const route = useRoute();
const { data, error, loading, fetchOrder, fetchOrderClient } = useCustomerOrder('soft-login');
const { send } = useNotification();
const initialLoadPending = ref(false);

definePageMeta({
  pageType: 'static',
  skipBlocksFetch: true,
});

watch(
  () => error.value,
  (value) => {
    if (value) {
      send({
        type: 'warning',
        message: value.error.message,
      });
    }
  },
);

const createParams = (type?: string, value?: string) => {
  const params: OrderSearchParams = {
    orderId: route.params.orderId as string,
    accessKey: route.params.accessKey as string,
  };

  if (type === 'name' && value) {
    params.name = value;
  } else if (type === 'postcode' && value) {
    params.postcode = value;
  }
  return params;
};

const tryLoadInitialOrder = async (type?: string, value?: string) => {
  const params = createParams(type, value);

  try {
    if (import.meta.client) {
      await fetchOrderClient(params);
      return;
    }
    await fetchOrder(params);
  } finally {
    initialLoadPending.value = false;
  }
};

const tryLoadAfterSoftLogin = async (type?: string, value?: string) => {
  const params = createParams(type, value);
  await fetchOrderClient(params);
};

// SSR: await so the order is in the HTML payload.
if (import.meta.server) {
  await tryLoadInitialOrder();
}

// Client-only navigation fallback: keep setup sync, fetch after mount.
onMounted(() => {
  if (data.value || error.value) return;
  initialLoadPending.value = true;
  void tryLoadInitialOrder();
});
</script>
