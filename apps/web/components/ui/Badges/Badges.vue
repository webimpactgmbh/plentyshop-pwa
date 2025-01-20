<template>
  <div v-if="haveBadges" data-testid="badges">
    <ul>
      <template v-if="tagsEnabled && productTags.length > 0">
        <SfListItem
          v-for="(tag, index) in productTags"
          :key="index"
          size="sm"
          class="text-xs font-medium select-none rounded-md !w-fit !px-2 opacity-75 mr-2 mb-2 cursor-pointer"
          :class="[
            tagGetters.getAgenciesTagCLass(tag),
            tagGetters.getTagTextColorIsDark(tag) ? 'text-dark' : 'text-white',
          ]"
          @click="onTagClick(tag)"
          :style="{ backgroundColor: tagGetters.getTagBackgroundColor(tag) }"
        >
          {{ tagGetters.getTagName(tag) }}
        </SfListItem>
      </template>

      <SfListItem
        v-if="availabilityEnabled && productGetters.getAvailabilityName(product)"
        size="sm"
        class="text-xs font-medium select-none rounded-md !w-fit !cursor-text !px-2 grid mt-2"
        :class="[productGetters.getAgenciesAvailabilityCLass(product)]"
        :style="availabilityStyles"
      >
        <div class="flex flex-row justify-center items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#000000"
            stroke-width="1"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mr-3"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          {{ productGetters.getAvailabilityName(product) }}
        </div>
      </SfListItem>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { SfListItem } from '@storefront-ui/vue';
import { type ProductTag, productGetters, tagGetters } from '@plentymarkets/shop-api';
import type { BadgesProps } from '~/components/ui/Badges/types';

const localePath = useLocalePath();

const { product, useTags = true, useAvailability = false } = defineProps<BadgesProps>();
const productTags = ref([] as ProductTag[]);
const availabilityStyles = ref({});

const availabilityEnabled = useAvailability;
if (availabilityEnabled) {
  availabilityStyles.value = {
    backgroundColor: productGetters.getAvailabilityBackgroundColor(product),
    color: productGetters.getAvailabilityTextColor(product),
  };
}

const tagsEnabled = useTags;
if (tagsEnabled) {
  productTags.value = tagGetters.getTags(product);
}

const haveBadges = computed(
  () =>
    (tagsEnabled && productTags.value.length > 0) ||
    (availabilityEnabled && productGetters.getAvailabilityName(product)),
);

const onTagClick = (tag: ProductTag) => {
  navigateTo(localePath(`/tag/${tagGetters.getTagName(tag)}_${tagGetters.getTagId(tag)}`));
};
</script>
