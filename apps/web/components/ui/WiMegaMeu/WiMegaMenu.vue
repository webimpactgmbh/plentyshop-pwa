<template>
  <header ref="referenceRef" :class="[
    headerClass,
    'relative w-full md:sticky z-10 transition-all duration-500 ease-in-out',
    { 'bg-white-header md:shadow-md': !isTransparent, 'bg-transparent-header': isTransparent }
]">
    <div
      class="flex justify-between items-center flex-wrap md:flex-nowrap px-4 md:px-10 w-full"
      data-testid="navbar-top"
    >
      <div v-if="viewport.isGreaterOrEquals('lg')" class="flex items-center">
        <UiButton
          v-if="viewport.isLessThan('lg')"
          variant="tertiary"
          square
          :aria-label="t('closeMenu')"
          class="mr-5 bg-transparent hover:bg-orange-500 hover:text-white active:bg-orange-600 active:text-white"
          @click="openMenu([])"
        >
          <SfIconMenu class="text-black group-hover:text-white group-active:text-white" />
        </UiButton>

        <NuxtLink
          :to="localePath(paths.home)"
          :aria-label="t('goToHomepage')"
          class="flex shrink-0 w-full lg:w-48 items-center mr-auto text-black md:mr-10 focus-visible:outline focus-visible:outline-offset focus-visible:rounded-sm"
        >
          <UiWiLogo/>
        </NuxtLink>
      </div>

      <div v-if="viewport.isGreaterOrEquals('lg')">
        <nav ref="navRef" class="relative w-full">
          <ul
            class="flex flex-wrap px-6 py-2"
            @blur="
              (event) => {
                if (!(event.currentTarget as Element).contains(event.relatedTarget as Element)) {
                  close();
                }
              }
            "
          >
            <li v-if="categoryTree.length === 0" class="h-10" />

            <li v-for="(menuNode, index) in categoryTree" v-else :key="index">
              <NuxtLink :to="localePath(generateCategoryLink(menuNode))">
                <UiButton
                  ref="triggerReference"
                  variant="tertiary"
                  data-testid="category-button"
                  :class="{
                    'group mr-2 !text-black hover:bg-orange-500 hover:text-white active:bg-orange-600 active:text-white': true,
                    '!bg-orange-500 !text-white': activeNode.includes(menuNode.id),
                  }"
                  @mouseenter="menuNode.childCount > 0 ? openMenu([menuNode.id]) : openMenu([])"
                  @click="menuNode.childCount > 0 ? openMenu([menuNode.id]) : openMenu([])"
                >
                  <span class="group-hover:text-white">{{ categoryTreeGetters.getName(menuNode) }}</span>
                  <SfIconChevronRight
                    v-if="menuNode.childCount > 0"
                    class="rotate-90 text-neutral-500 group-hover:text-white group-active:text-white"
                  />
                </UiButton>
              </NuxtLink>

              <div
                v-if="isOpen && activeMenu && activeNode.length === 1 && activeNode[0] === menuNode.id && menuNode.childCount > 0"
                ref="megaMenuReference"
                class="hidden md:grid gap-x-6 grid-cols-4 bg-white shadow-lg p-6 absolute left-0 right-0 w-full max-w-[865px] mx-auto"
                :style="submenuStyle"
                tabindex="0"
                @mouseleave="close()"
                @keydown.esc="focusTrigger(index)"
              >
                <template v-for="node in activeMenu.children" :key="node.id">
                  <template v-if="node.childCount === 0">
                    <ul>
                      <SfListItem
                        :tag="NuxtLink"
                        size="sm"
                        :href="localePath(generateCategoryLink(node))"
                        class="typography-text-sm mb-2 hover:bg-orange-500 hover:text-white"
                      >
                        {{ categoryTreeGetters.getName(node) }}
                      </SfListItem>
                    </ul>
                  </template>
                  <div v-else>
                    <SfListItem
                      :tag="NuxtLink"
                      size="sm"
                      :href="localePath(generateCategoryLink(node))"
                      class="typography-text-base font-medium text-black whitespace-nowrap px-4 py-1.5 border-b border-b-neutral-200 hover:bg-orange-500 hover:text-white"
                    >
                      {{ categoryTreeGetters.getName(node) }}
                    </SfListItem>
                    <ul class="mt-2">
                      <li v-for="child in node.children" :key="child.id">
                        <SfListItem
                          v-if="categoryTreeGetters.getName(child)"
                          :tag="NuxtLink"
                          size="sm"
                          :href="localePath(generateCategoryLink(child))"
                          class="typography-text-sm py-1.5 hover:bg-orange-500 hover:text-white"
                        >
                          {{ categoryTreeGetters.getName(child) }}
                        </SfListItem>
                      </li>
                    </ul>
                  </div>
                </template>
              </div>
            </li>
          </ul>
        </nav>
      </div>
      <!-- Mobil -->
      <template v-else>
        <div class="flex items-center justify-between w-full relative">
          <!-- Menü -->
          <UiButton
            v-if="viewport.isLessThan('lg')"
            variant="tertiary"
            square
            :aria-label="t('closeMenu')"
            class="bg-transparent hover:bg-orange-500 hover:text-white active:bg-orange-600 active:text-white"
            @click="openMenu([])"
          >
            <SfIconMenu class="text-black group-hover:text-white group-active:text-white" />
          </UiButton>

          <!-- Logo -->
          <NuxtLink
            :to="localePath(paths.home)"
            :aria-label="t('goToHomepage')"
            class="lg:w-48 absolute left-1/2 transform -translate-x-1/2"
          >
            <UiWiLogo/>
          </NuxtLink>

          <!-- Such-Button -->
          <nav v-if="viewport.isLessThan('md')" class="flex justify-around items-center space-x-1 p-1">
            <UiButton
              class="group text-black hover:text-white hover:bg-orange-500 transition-colors duration-200 ease-in-out p-1 rounded-full"
              variant="tertiary"
              :aria-label="t('openSearchModalButtonLabel')"
              @click="searchModalOpen"
            >
              <SfIconSearch class="w-6 h-6" />
            </UiButton>
          </nav>

          <div
            v-if="isSearchModalOpen"
            class="fixed inset-0 bg-black bg-opacity-70 z-50"
          ></div>

          <transition name="modal-fade">
            <div
              v-if="isSearchModalOpen"
              class="fixed inset-0 z-50 flex items-center justify-center px-4"
            >
              <div class="relative bg-white p-6 rounded-2xl w-full max-w-[480px] shadow-2xl">
                <header class="flex justify-between items-center mb-4">
                  <h3 class="text-xl font-semibold text-black">{{ t('search') }}</h3>
                  <UiButton
                    square
                    variant="tertiary"
                    @click="searchModalClose"
                    :aria-label="t('closeMenu')"
                    class="hover:bg-gray-200 rounded-full"
                  >
                    <SfIconClose class="text-gray-600 w-5 h-5" />
                  </UiButton>
                </header>

                <div class="mb-4">
                  <UiSearch :close="searchModalClose" class="border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-orange-500"/>
                </div>

                <footer class="flex justify-end">
                  <UiButton
                    type="button"
                    variant="primary"
                    class="px-4 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-all"
                    @click="triggerSearch"
                  >
                    {{ t('search') }}
                  </UiButton>

                </footer>
              </div>
            </div>
          </transition>
        </div>
        <div v-if="isOpen" class="fixed z-[50] inset-0 bg-neutral-500 bg-opacity-50" />
          <SfDrawer
            ref="drawerReference"
            v-model="isOpen"
            placement="left"
            class="right-12 max-w-96 bg-white text-black overflow-y-auto z-[1000]"
          >
            <nav>
              <div class="flex items-center justify-between p-4 border-b border-b-neutral-200 border-b-solid">
                <p class="typography-text-base font-medium">Browse products</p>
                <UiButton variant="tertiary" square :aria-label="t('closeMenu')" class="ml-2" @click="close()">
                  <SfIconClose class="text-neutral-500" />
                </UiButton>
              </div>
              <ul v-if="activeMenu" class="mt-2 mb-6">
                <li v-if="activeMenu.id !== 0">
                  <SfListItem
                    size="lg"
                    tag="button"
                    type="button"
                    class="border-b border-b-neutral-200 border-b-solid"
                    @click="goBack()"
                  >
                    <div class="flex items-center">
                      <SfIconArrowBack class="text-neutral-500" />
                      <p class="ml-5 font-medium">{{ categoryTreeGetters.getName(activeMenu) }}</p>
                    </div>
                  </SfListItem>
                </li>
                <template v-for="node in activeMenu.children" :key="node.id">
                  <li v-if="node.childCount === 0">
                    <SfListItem size="lg" :tag="NuxtLink" :href="localePath(generateCategoryLink(node))" @click="close()">
                      <div class="flex items-center">
                        <p class="text-left">{{ categoryTreeGetters.getName(node) }}</p>
                        <SfCounter class="ml-2">{{ categoryTreeGetters.getCount(node) }}</SfCounter>
                      </div>
                    </SfListItem>
                  </li>
                  <li v-else>
                    <SfListItem size="lg" tag="button" type="button" class="!p-0">
                      <div class="flex items-center w-100">
                        <NuxtLink class="flex-1 m-0 p-4 pr-0" :to="localePath(generateCategoryLink(node))" @click="close()">
                          <div class="flex items-center">
                            <p class="text-left">{{ categoryTreeGetters.getName(node) }}</p>
                            <SfCounter class="ml-2">{{ categoryTreeGetters.getCount(node) }}</SfCounter>
                          </div>
                        </NuxtLink>
                        <div class="flex justify-center items-center h-8 w-16" @click="goNext(node.id)">
                          <SfIconChevronRight class="text-neutral-500" />
                        </div>
                      </div>
                    </SfListItem>
                  </li>
                </template>
              </ul>
            </nav>
        </SfDrawer>
      </template>
      <slot />
    </div>
  </header>
</template>



<script lang="ts" setup>
import { type CategoryTreeItem, categoryTreeGetters } from '@plentymarkets/shop-api';
import {
  SfIconClose,
  SfDrawer,
  SfListItem,
  SfIconChevronRight,
  SfCounter,
  SfIconArrowBack,
  SfIconMenu,
  SfIconSearch,
  useTrapFocus,
  useDropdown,
} from '@storefront-ui/vue';
import { unrefElement } from '@vueuse/core';
import type { MegaMenuProps } from '~/components/MegaMenu/types';
import { paths } from '~/utils/paths';

const { t } = useI18n();
const viewport = useViewport();
const localePath = useLocalePath();
const { buildCategoryMenuLink } = useLocalization();
const NuxtLink = resolveComponent('NuxtLink');
const props = defineProps<MegaMenuProps & { isTransparent?: boolean }>();
const { close, open, isOpen, activeNode, category, setCategory } = useMegaMenu();
const { referenceRef, floatingRef, style } = useDropdown({
  isOpen,
  onClose: close,
  placement: 'bottom',
  middleware: [],
});
const categoryTree = ref(categoryTreeGetters.getTree(props.categories));

const findNode = (keys: number[], node: CategoryTreeItem): CategoryTreeItem => {
  if (keys.length > 1) {
    const [currentKey, ...restKeys] = keys;
    return findNode(restKeys, node.children?.find((child) => child.id === currentKey) || node);
  } else {
    return node.children?.find((child) => child.id === keys[0]) || node;
  }
};

const generateCategoryLink = (category: CategoryTreeItem) => {
  return buildCategoryMenuLink(category, categoryTree.value);
};

const drawerReference = ref();
const megaMenuReference = ref();
const triggerReference = ref();

const navRef = ref<HTMLElement | null>(null);
const submenuRef = ref<HTMLElement | null>(null);
const submenuStyle = ref({ width: "auto", left: "0px" });

const triggerSearch = () => {
  handleSearch();
};

const isSearchModalOpen = ref(false);
const searchModalOpen = (): boolean => {
  isSearchModalOpen.value = true;
  return true;
};

const searchModalClose = (): boolean => {
  isSearchModalOpen.value = false;
  return false;
};

const handleSearch = () => {
  console.log('Suche gestartet');
  searchModalClose();
};
const updateSubmenuPosition = () => {
  if (navRef.value && submenuRef.value) {
    const navRect = navRef.value.getBoundingClientRect();

    submenuStyle.value = {
      width: `${navRect.width}px`,
      left: `${navRect.left}px`,
    };
  }
};

onMounted(() => {
  updateSubmenuPosition();
  window.addEventListener("resize", updateSubmenuPosition);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateSubmenuPosition);
});


const activeMenu = computed(() => (category.value ? findNode(activeNode.value, category.value) : null));

const trapFocusOptions = {
  activeState: isOpen,
  arrowKeysUpDown: true,
  initialFocus: 'container',
} as const;
useTrapFocus(
  computed(() => megaMenuReference.value?.[0]),
  trapFocusOptions,
);
useTrapFocus(drawerReference, trapFocusOptions);

const openMenu = (menuType: number[]) => {
  activeNode.value = menuType;
  open();
};

const goBack = () => {
  activeNode.value = activeNode.value.slice(0, -1);
};

const goNext = (key: number) => {
  activeNode.value = [...activeNode.value, key];
};

const focusTrigger = (index: number) => {
  unrefElement(triggerReference.value[index]).focus();
};

setCategory(categoryTree.value);

watch(
  () => props.categories,
  async (categories: CategoryTreeItem[]) => {
    categoryTree.value = categoryTreeGetters.getTree(categories);
    setCategory(categoryTree.value);
  },
);

const headerClass = computed(() => ({
  'z-[10]': isOpen.value,
}));
</script>
<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}
</style>
