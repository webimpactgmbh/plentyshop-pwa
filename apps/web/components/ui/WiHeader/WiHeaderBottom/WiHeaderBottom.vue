<template>
  <MegaMenu :categories="categoryTree" :isTransparent="isTransparent">
    <template v-if="viewport.isGreaterOrEquals('md')">
      <div class="flex items-center flex-2">
        <WiSearch class="hidden md:block w-full md:w-[300px] max-w-[90vw]" />
        <nav class="hidden ml-4 md:flex md:flex-row md:flex-nowrap space-x-1">
          <SfDropdown v-if="isAuthorized" v-model="isAccountDropdownOpen" placement="bottom-end" class="z-50">
            <template #trigger>
              <UiButton
                variant="tertiary"
                class="relative text-black hover:text-white hover:bg-orange-500 transition-colors duration-200 ease-in-out p-3 icon-border"
                :class="{ 'bg-primary-700': isAccountDropdownOpen }"
                data-testid="account-dropdown-button"
                @click="accountDropdownToggle()"
              >
                <template #prefix>
                  <SfIconPerson class="w-7 h-7" />
                </template>
                {{ user.user?.firstName }}
              </UiButton>
            </template>
          </SfDropdown>

          <UiButton
            v-else
            class="group relative text-black hover:text-white hover:bg-orange-500 transition-colors duration-200 ease-in-out p-3 icon-border"
            :class="[{ 'text-black hover:text-white ': !isTransparent, 'text-white hover:text-black ': isTransparent }]"

            variant="tertiary"
            :aria-label="t('auth.login.openLoginForm')"
            square
            @click="navigateToLogin"
          >
            <SfIconPerson class="w-7 h-7" />
          </UiButton>

          <UiButton
            class="group relative text-black hover:text-white hover:bg-orange-500 transition-colors duration-200 ease-in-out p-3 icon-border"
            :class="[{ 'text-black hover:text-white ': !isTransparent, 'text-white hover:text-black ': isTransparent }]"

            :tag="NuxtLink"
            :to="localePath(paths.wishlist)"
            :aria-label="t('numberInWishlist', { count: wishlistItemIds.length })"
            variant="tertiary"
            square
            data-testid="wishlist-page-navigation"
          >
            <template #prefix>
              <SfIconFavorite class="w-7 h-7" />
              <SfBadge
                v-if="wishlistItemIds.length > 0"
                :content="wishlistItemIds.length"
                class="outline outline-primary-500 bg-white !text-neutral-900 group-hover:outline-primary-800 group-active:outline-primary-700 flex justify-center items-center text-xs min-w-[16px] min-h-[16px]"
                :class="[{ 'text-black hover:text-white ': !isTransparent, 'text-white hover:text-black ': isTransparent }]"
                data-testid="wishlist-badge"
                placement="top-right"
                :max="99"
              />
            </template>
          </UiButton>

          <UiButton
            class="group relative flex items-center gap-1 text-black hover:text-white hover:bg-orange-500 transition-colors duration-200 ease-in-out p-2 pl-6 pr-6 icon-border"
            :class="[{ 'text-black hover:text-white ': !isTransparent, 'text-white hover:text-black ': isTransparent }]"

            :tag="NuxtLink"
            :to="localePath(paths.cart)"
            :aria-label="t('numberInCart', { count: cartItemsCount })"
            variant="tertiary"
          >
            <SfIconShoppingCart class="w-7 h-7" />
            <div
              class="text-black group-hover:text-white font-bold flex items-center justify-center text-lg min-w-[15px] border-none outline-none shadow-none icon-border"
              :class="[{ 'text-black hover:text-white ': !isTransparent, 'text-white hover:text-black ': isTransparent }]"

            >
              {{ cartItemsCount }}
            </div>
          </UiButton>
        </nav>
      </div>
    </template>

    <div v-if="viewport.isLessThan('lg')">
      <UiButton
        variant="tertiary"
        class="relative text-white hover:text-white active:text-white hover:bg-primary-800 active:bg-primary-700 md:hidden icon-border"
        square
        :aria-label="t('openSearchModalButtonLabel')"
        @click="searchModalOpen"
      >
        <SfIconSearch />
      </UiButton>
    </div>
  </MegaMenu>
  <UiModal
    v-if="viewport.isGreaterOrEquals('md') && isAuthenticationOpen"
    v-model="isAuthenticationOpen"
    tag="section"
    class="h-full md:w-[500px] md:h-fit m-0 p-0 overflow-y-auto"
  >
    <header>
      <UiButton
        :aria-label="$t('closeDialog')"
        square
        variant="tertiary"
        class="absolute right-2 top-2"
        @click="closeAuthentication"
      >
        <SfIconClose />
      </UiButton>
    </header>
    <LoginComponent v-if="isLogin" :is-modal="true" @change-view="isLogin = false" @logged-in="closeAuthentication" />
    <Register v-else :is-modal="true" @change-view="isLogin = true" @registered="closeAuthentication" />
  </UiModal>

  <NuxtLazyHydrate v-if="viewport.isLessThan('lg')" when-idle>
    <SfModal
      v-model="isSearchModalOpen"
      class="w-full h-full z-50"
      tag="section"
      role="dialog"
      aria-labelledby="search-modal-title"
    >
      <header class="mb-4">
        <UiButton square variant="tertiary" class="absolute right-4 top-2" @click="searchModalClose">
          <SfIconClose class="text-neutral-500" />
        </UiButton>
        <h3 id="search-modal-title" class="absolute left-6 top-4 font-bold typography-headline-4 mb-4">
          {{ t('search') }}
        </h3>
      </header>
      <UiSearch :close="searchModalClose" />
    </SfModal>
  </NuxtLazyHydrate>
</template>

<script setup lang="ts">
import {
  SfBadge,
  SfDropdown,
  SfIconClose,
  SfIconLanguage,
  SfIconPerson,
  SfIconSearch,
  SfIconShoppingCart,
  SfListItem,
  SfModal,
  SfIconFavorite,
  useDisclosure,
} from '@storefront-ui/vue';
import LanguageSelector from '~/components/LanguageSelector/LanguageSelector.vue';
import { paths } from '~/utils/paths';
import WiSearch from '~/components/ui/WiSearch/WiSearch.vue';

const isLogin = ref(true);
const { data: cart } = useCart();
const { wishlistItemIds } = useWishlist();
const cartItemsCount = ref(0);

const NuxtLink = resolveComponent('NuxtLink');
const { t, localeCodes } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const { isOpen: isAccountDropdownOpen, toggle: accountDropdownToggle } = useDisclosure();
const { isOpen: isAuthenticationOpen, open: openAuthentication, close: closeAuthentication } = useDisclosure();
const { open: searchModalOpen, isOpen: isSearchModalOpen, close: searchModalClose } = useDisclosure();
const { toggle: toggleLanguageSelect, isOpen: isLanguageSelectOpen } = useLocalization();
const { data: categoryTree } = useCategoryTree();
const { data: user, isAuthorized, logout } = useCustomer();
const viewport = useViewport();
const runtimeConfig = useRuntimeConfig();
const showConfigurationDrawer = runtimeConfig.public.showConfigurationDrawer;
const { isEditing, disableActions } = useEditor();
const props = defineProps<{
  isTransparent?: boolean
}>();

onNuxtReady(() => {
  cartItemsCount.value = cart.value?.items?.reduce((price, { quantity }) => price + quantity, 0) ?? 0;
});

watch(
  () => cart.value?.items,
  (cartItems) => {
    cartItemsCount.value = cartItems?.reduce((price, { quantity }) => price + quantity, 0) ?? 0;
  },
);

watch(
  () => isAuthenticationOpen.value,
  async () => {
    isLogin.value = true;
  },
);

const logOut = async () => {
  accountDropdownToggle();
  await logout();
  navigateTo(localePath(paths.home));
};

const accountDropdown = computed(() => [
  {
    label: t('account.heading'),
    link: localePath(paths.account),
  },
  {
    label: t('account.ordersAndReturns.section.myOrders'),
    link: localePath(paths.accountMyOrders),
  },
  {
    label: t('account.ordersAndReturns.section.returns'),
    link: localePath(paths.accountReturns),
  },
  {
    label: t('account.logout'),
  },
]);
const navigateToLogin = () => {
  if (route.path !== localePath(paths.authLogin)) {
    openAuthentication();
  }
};
</script>