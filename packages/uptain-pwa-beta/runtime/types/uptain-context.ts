/**
 * Injected context for useUptainData so the composable does not rely on Nuxt auto-imports
 * when the package runs from node_modules. The client plugin builds this inside
 * nuxtApp.runWithContext() and passes it to useUptainData.
 */
import type { Ref } from 'vue';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import type { RuntimeConfig } from 'nuxt/schema';
export interface UptainContext {
  getRoute: () => RouteLocationNormalizedLoaded | Ref<RouteLocationNormalizedLoaded>;
  getRuntimeConfig: () => RuntimeConfig;
  getState: <T>(key: string, init: () => T) => Ref<T>;
  useCustomer: () => { user: Ref<unknown>; isAuthorized: Ref<boolean> };
  useWishlist: () => {
    wishlistItemIds: Ref<unknown>;
    data: Ref<unknown>;
    loading: Ref<boolean>;
    fetchWishlist: () => Promise<unknown>;
  };
  getSiteSetting: (key: string) => () => unknown;
  getLocalePath: (path: string) => string;
  useProducts: () => { data: Ref<unknown>; currentProduct?: Ref<unknown> };
  useCart: () => { data: Ref<unknown> };
  useAddressStore: (type: number) => {
    addresses: Ref<unknown>;
    get: (id: number) => unknown;
  };
  useCartShippingMethods: () => { data: Ref<unknown>; selectedMethod: Ref<unknown> };
  usePaymentMethods: () => { data: Ref<unknown> };
  useCategoryTree: () => { data: Ref<unknown> };
  useCategoryFilter: () => { getFacetsFromURL: () => { sort?: string } };
  useSearch: () => { data: Ref<unknown> };
  useCustomerOrders: () => { fetchCustomerOrders: (opts: { page: number }) => Promise<unknown> };
}
