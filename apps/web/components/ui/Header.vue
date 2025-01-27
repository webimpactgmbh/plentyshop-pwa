<template>
  <MegaMenu :categories="categoryTree">
    <template v-if="viewport.isGreaterOrEquals('md')">
      <UiSearch class="hidden md:block flex-1" />
      <nav class="hidden ml-4 md:flex md:flex-row md:flex-nowrap">
        <template v-if="localeCodes.length > 1">
          <UiButton
            v-if="!isLanguageSelectOpen"
            class="group relative hover:text-white active:text-white hover:bg-orange-500 active:bg-orange-500 mr-1 -ml-0.5 rounded-md cursor-pointer"
            :aria-label="t('languageSelector')"
            variant="tertiary"
            square
            data-testid="open-languageselect-button"
            @click="toggleLanguageSelect()"
            :disabled="
              (showConfigurationDrawer && isEditing) ||
              (showConfigurationDrawer && disableActions)
            "
          >
            <template #prefix>
              <SfIconLanguage class="relative" />
            </template>
          </UiButton>
          <UiButton
            v-else
            class="group relative text-white hover:text-white active:text-white hover:bg-orange-600 active:bg-orange-500 mr-1 -ml-0.5 rounded-md cursor-pointer"
            :aria-label="t('languageSelector')"
            variant="tertiary"
            square
            data-testid="open-languageselect-button"
          >
            <template #prefix>
              <SfIconLanguage class="relative" />
            </template>
          </UiButton>
        </template>
        <UiButton
          class="group relative hover:text-white active:text-white hover:bg-orange-600 active:bg-orange-500 mr-1 -ml-0.5 rounded-md"
          :tag="NuxtLink"
          :to="localePath(paths.wishlist)"
          :aria-label="t('numberInWishlist', { count: wishlistItemIds.length })"
          variant="tertiary"
          square
          data-testid="wishlist-page-navigation"
        >
          <template #prefix>
            <svg
              width="29"
              height="29"
              viewBox="0 0 29 29"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14.5129 7.25138C7.85417 1.20834 1.20834 9.66667 6.98545 15.709L14.5129 24.1667L22.0404 15.709C27.7917 9.66667 21.1458 1.20834 14.5129 7.25138Z"
                stroke="#111928"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>

            <SfBadge
              :content="wishlistItemIds.length"
              class="outline outline-primary-500 bg-white !text-neutral-900 group-hover:outline-primary-800 group-active:outline-primary-700 flex justify-center items-center text-xs min-w-[16px] min-h-[16px]"
              data-testid="wishlist-badge"
              placement="top-right"
              :max="99"
            />
          </template>
        </UiButton>

        <SfDropdown
          v-if="isAuthorized"
          v-model="isAccountDropdownOpen"
          placement="bottom-end"
          class="z-50"
        >
          <template #trigger>
            <UiButton
              variant="tertiary"
              class="relative text-white hover:text-white active:text-white  rounded-md"
              :class="{ 'bg-primary-700': isAccountDropdownOpen }"
              @click="accountDropdownToggle()"
              data-testid="account-dropdown-button"
            >
              <template #prefix>
                <SfIconPerson />
              </template>
              {{ user.user?.firstName }}
            </UiButton>
          </template>
          <ul
            class="rounded bg-white shadow-md border border-neutral-100 text-neutral-900 min-w-[152px] py-2"
          >
            <li
              v-for="({ label, link }, labelIndex) in accountDropdown"
              :key="`label-${labelIndex}`"
            >
              <template v-if="label === t('account.logout')">
                <UiDivider class="my-2" />
                <SfListItem
                  tag="button"
                  class="text-left"
                  data-testid="account-dropdown-logout-item"
                  @click="logOut()"
                >
                  {{ label }}
                </SfListItem>
              </template>
              <SfListItem
                v-else
                :tag="NuxtLink"
                :to="link"
                :class="{ 'bg-neutral-200': route.path === link }"
                data-testid="account-dropdown-list-item"
              >
                {{ label }}
              </SfListItem>
            </li>
          </ul>
        </SfDropdown>
        <UiButton
          v-else
          @click="navigateToLogin"
          class="group relative text-white hover:text-white active:text-white  mr-1 -ml-0.5 rounded-md"
          variant="tertiary"
          :aria-label="t('auth.login.openLoginForm')"
          square
        >
          <svg
            width="35"
            height="35"
            viewBox="0 0 35 35"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10.2084 24.7917V26.25C10.2084 27.0554 10.8613 27.7083 11.6667 27.7083H23.3334C24.1388 27.7083 24.7917 27.0554 24.7917 26.25V24.7917C24.7917 22.3754 22.833 20.4167 20.4167 20.4167H14.5834C12.1671 20.4167 10.2084 22.3754 10.2084 24.7917Z"
              stroke="#111928"
              stroke-width="2"
            />
            <path
              d="M21.875 11.6667C21.875 14.0829 19.9163 16.0417 17.5 16.0417C15.0838 16.0417 13.125 14.0829 13.125 11.6667C13.125 9.25042 15.0838 7.29167 17.5 7.29167C19.9163 7.29167 21.875 9.25042 21.875 11.6667Z"
              stroke="#111928"
              stroke-width="2"
            />
          </svg>
        </UiButton>
        <UiButton
          v-if="showConfigurationDrawer"
          @click="open = true"
          class="group relative text-white hover:text-white active:text-white  mr-1 -ml-0.5 rounded-md"
          variant="tertiary"
          :aria-label="t('openConfigurationDrawer')"
          square
        >
          <SfIconTune />
        </UiButton>
        <UiButton
          class="relative inline-flex items-center text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 hover:text-white mr-1 py-1 px-6 space-x-2 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-full"
          :tag="NuxtLink"
          :to="localePath(paths.cart)"
          :aria-label="t('numberInCart', { count: cartItemsCount })"
          variant="tertiary"
        >
          <!-- Icon (prefix slot) -->
          <template #prefix>
            <svg
              width="35"
              height="35"
              viewBox="0 0 35 35"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.29163 5.83333H9.47913L13.125 23.3333M13.125 23.3333H24.7916M13.125 23.3333C11.5141 23.3333 10.2083 24.6392 10.2083 26.25C10.2083 27.8608 11.5141 29.1667 13.125 29.1667C14.7358 29.1667 16.0416 27.8608 16.0416 26.25C16.0416 24.6392 14.7358 23.3333 13.125 23.3333ZM24.7916 23.3333C23.1808 23.3333 21.875 24.6392 21.875 26.25C21.875 27.8608 23.1808 29.1667 24.7916 29.1667C26.4025 29.1667 27.7083 27.8608 27.7083 26.25C27.7083 24.6392 26.4025 23.3333 24.7916 23.3333ZM12.3958 18.9583H25.8854L27.7083 10.2083H10.664"
                stroke="white"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </template>

          <!-- The cart item count -->
          <span class="font-bold text-xl">{{ cartItemsCount }}</span>
        </UiButton>
      </nav>
    </template>

    <div v-if="viewport.isLessThan('lg')">
      <UiButton
        variant="tertiary"
        class="relative text-white hover:text-white active:text-white  rounded-md md:hidden"
        square
        data-testid="open-languageselect-button"
        :aria-label="t('languageSelector')"
        @click="toggleLanguageSelect()"
        :disabled="
          (showConfigurationDrawer && isEditing) ||
          (showConfigurationDrawer && disableActions)
        "
      >
        <SfIconLanguage />
      </UiButton>
      <UiButton
        variant="tertiary"
        class="relative text-white hover:text-white active:text-white  rounded-md md:hidden"
        square
        @click="searchModalOpen"
        :aria-label="t('openSearchModalButtonLabel')"
      >
        <SfIconSearch />
      </UiButton>
    </div>
  </MegaMenu>
  <LanguageSelector />
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
    <LoginComponent
      v-if="isLogin"
      @change-view="isLogin = false"
      @logged-in="closeAuthentication"
      :is-modal="true"
    />
    <Register
      v-else
      @change-view="isLogin = true"
      @registered="closeAuthentication"
      :is-modal="true"
    />
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
        <UiButton
          square
          variant="tertiary"
          class="absolute right-4 top-2"
          @click="searchModalClose"
        >
          <SfIconClose class="text-neutral-500" />
        </UiButton>
        <h3
          id="search-modal-title"
          class="absolute left-6 top-4 font-bold typography-headline-4 mb-4"
        >
          {{ t("search") }}
        </h3>
      </header>
      <UiSearch :close="searchModalClose" />
    </SfModal>
  </NuxtLazyHydrate>
  <LazyConfigurationDrawer v-if="showConfigurationDrawer" />
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
  SfIconTune,
  SfListItem,
  SfModal,
  SfIconFavorite,
  useDisclosure,
} from "@storefront-ui/vue";
import LanguageSelector from "~/components/LanguageSelector/LanguageSelector.vue";
import { paths } from "~/utils/paths";

const isLogin = ref(true);
const { data: cart } = useCart();
const { wishlistItemIds } = useWishlist();
const cartItemsCount = ref(0);

const NuxtLink = resolveComponent("NuxtLink");
const { t, localeCodes } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const { isOpen: isAccountDropdownOpen, toggle: accountDropdownToggle } = useDisclosure();
const {
  isOpen: isAuthenticationOpen,
  open: openAuthentication,
  close: closeAuthentication,
} = useDisclosure();
const {
  open: searchModalOpen,
  isOpen: isSearchModalOpen,
  close: searchModalClose,
} = useDisclosure();
const { open } = useConfigurationDrawer();
const { toggle: toggleLanguageSelect, isOpen: isLanguageSelectOpen } = useLocalization();
const { data: categoryTree } = useCategoryTree();
const { data: user, isAuthorized, logout } = useCustomer();
const viewport = useViewport();
const runtimeConfig = useRuntimeConfig();
const showConfigurationDrawer = runtimeConfig.public.showConfigurationDrawer;
const { isEditing, disableActions } = useEditor();

onNuxtReady(() => {
  cartItemsCount.value =
    cart.value?.items?.reduce((price, { quantity }) => price + quantity, 0) ?? 0;
});

watch(
  () => cart.value?.items,
  (cartItems) => {
    cartItemsCount.value =
      cartItems?.reduce((price, { quantity }) => price + quantity, 0) ?? 0;
  }
);

watch(
  () => isAuthenticationOpen.value,
  async () => {
    isLogin.value = true;
  }
);

const logOut = async () => {
  accountDropdownToggle();
  await logout();
  navigateTo(localePath(paths.home));
};

const accountDropdown = computed(() => [
  {
    label: t("account.heading"),
    link: localePath(paths.account),
  },
  {
    label: t("account.ordersAndReturns.section.myOrders"),
    link: localePath(paths.accountMyOrders),
  },
  {
    label: t("account.ordersAndReturns.section.returns"),
    link: localePath(paths.accountReturns),
  },
  {
    label: t("account.logout"),
  },
]);
const navigateToLogin = () => {
  if (route.path !== localePath(paths.authLogin)) {
    openAuthentication();
  }
};
</script>
