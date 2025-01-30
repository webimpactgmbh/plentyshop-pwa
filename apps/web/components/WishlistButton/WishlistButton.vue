<template>
  <UiButton
    variant="tertiary"
    size="sm"
    :aria-label="
      isWishlistItem(variationId)
        ? t('removeProductFromWishlist', { label: productName })
        : t('addProductToWishlist', { label: productName })
    "
    :class="{ 'p-[0.5rem]': !isCloseButton }"
    class="m-2 border border-neutral-500 rounded-md"
    :disabled="wishlistLoading"
    data-testid="wishlist-trigger"
    @click="onWishlistClick"
  >
    <SfLoaderCircular
      v-if="actionLoading"
      class="flex justify-center items-center"
      size="sm"
    />
    <template v-else>
      <SfIconClose v-if="isCloseButton" size="sm" />
      <svg v-else-if="isWishlistItem(variationId)"
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="#ff0000"
        stroke="#ff0000"
        stroke-width="1"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        ></path>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
      <slot />
    </template>
  </UiButton>
</template>

<script setup lang="ts">
import type { WishlistButtonProps } from "~/components/WishlistButton/types";
import {
  SfIconFavorite,
  SfIconFavoriteFilled,
  SfLoaderCircular,
  SfIconClose,
} from "@storefront-ui/vue";
import { productGetters } from "@plentymarkets/shop-api";

const { product, quantity = 1, discard = false } = defineProps<WishlistButtonProps>();
const { t } = useI18n();
const { isWishlistItem, interactWithWishlist, loading: wishlistLoading } = useWishlist();
const actionLoading = ref(false);

const productName = computed(() => productGetters.getName(product));
const variationId = computed(() => productGetters.getVariationId(product));
const isCloseButton = computed(() => isWishlistItem(variationId.value) && discard);
const onWishlistClick = async () => {
  actionLoading.value = true;
  await interactWithWishlist(variationId.value, quantity);
  actionLoading.value = false;
};
</script>
