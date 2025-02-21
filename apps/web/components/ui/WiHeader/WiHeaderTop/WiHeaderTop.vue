<template>
  <WiMegaMenu :categories="categoryTree" :is-transparent="isTransparent" >
    <template v-if="viewport.isGreaterOrEquals('md')">
      <nav class="hidden ml-4 md:flex md:flex-row md:flex-nowrap space-x-1">
        <UiButton
          v-if="!isSearchVisible"
          class="group relative text-black hover:text-white hover:bg-orange-500 transition-colors duration-500 ease-in-out p-3 cursor-pointer icon-border"
          :class="[{ 'text-black hover:text-white ': !isTransparent, 'text-white hover:text-black ': isTransparent }]"
          variant="tertiary"
          :aria-label="t('openSearchModalButtonLabel')"
        >
          <SfIconSearch   @click="toggleSearch"  class="w-7 h-7" />
        </UiButton>
        <transition name="fade">
          <WiSearch v-show="isSearchVisible" class="absolute top-0 left-0 w-full md:w-[200px] max-w-[90vw] z-50 mt-2" />
        </transition>
        <SfDropdown v-if="isAuthorized" v-model="isAccountDropdownOpen" placement="bottom-end" class="z-50">
          <template #trigger>
            <UiButton
              variant="tertiary"
              class="relative text-black hover:text-white hover:bg-orange-500 transition-colors duration-500 ease-in-out p-3 icon-border"
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
          class="group relative text-black hover:text-white hover:bg-orange-500 transition-colors duration-500 ease-in-out p-3 icon-border"
          :class="[{ 'text-black hover:text-white ': !isTransparent, 'text-white hover:text-black ': isTransparent }]"
          variant="tertiary"
          :aria-label="t('auth.login.openLoginForm')"
          square
          @click="navigateToLogin"
        >
          <SfIconPerson class="w-7 h-7" />
        </UiButton>

        <UiButton
          class="group relative text-black hover:text-white hover:bg-orange-500 transition-colors duration-500 ease-in-out p-3  icon-border"
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
              data-testid="wishlist-badge"
              placement="top-right"
              :max="99"
            />
          </template>
        </UiButton>

        <UiButton
          class="group relative flex items-center gap-1 text-black hover:text-white hover:bg-orange-500 transition-colors duration-500 ease-in-out p-2 pl-6 pr-6 icon-border"
          :class="[{ 'text-black hover:text-white ': !isTransparent, 'text-white hover:text-black ': isTransparent }]"

          :tag="NuxtLink"
          :to="localePath(paths.cart)"
          :aria-label="t('numberInCart', { count: cartItemsCount })"
          variant="tertiary"
        >
          <SfIconShoppingCart class="w-7 h-7" />
          <div
            class="text-black group-hover:text-white font-bold flex items-center justify-center text-lg min-w-[15px] border-none outline-none shadow-none"
            :class="[{ 'text-black hover:text-white ': !isTransparent, 'text-white hover:text-black ': isTransparent }]"

          >
            {{ cartItemsCount }}
          </div>
        </UiButton>
      </nav>
    </template>
  </WiMegaMenu>
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

</template>


<script setup lang="ts">
import {
  SfBadge,
  SfDropdown,
  SfIconPerson,
  SfIconSearch,
  SfIconShoppingCart,
  SfIconFavorite,
  SfIconClose,
  useDisclosure,
} from '@storefront-ui/vue';
import { paths } from '~/utils/paths';
import WiMegaMenu from '~/components/ui/WiMegaMeu/WiMegaMenu.vue';
import WiSearch from '~/components/ui/WiSearch/WiSearch.vue';
const props = defineProps<{
  isTransparent?: boolean;
}>();

const isLogin = ref(true);
const { data: cart } = useCart();
const { wishlistItemIds } = useWishlist();
const cartItemsCount = ref(0);

const NuxtLink = resolveComponent('NuxtLink');
const { t } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const { isOpen: isAccountDropdownOpen, toggle: accountDropdownToggle } = useDisclosure();
const { isOpen: isAuthenticationOpen, open: openAuthentication, close: closeAuthentication } = useDisclosure();
const { open: searchModalOpen, isOpen: isSearchModalOpen, close: searchModalClose } = useDisclosure();
const { data: categoryTree } = useCategoryTree();
const { data: user, isAuthorized, logout } = useCustomer();
const viewport = useViewport();
const runtimeConfig = useRuntimeConfig();
const showConfigurationDrawer = runtimeConfig.public.showConfigurationDrawer;
const { isEditing, disableActions } = useEditor();

const isSearchVisible = ref(false);

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

const toggleSearch = () => {
  isSearchVisible.value = !isSearchVisible.value;
};

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

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
