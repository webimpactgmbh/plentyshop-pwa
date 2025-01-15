<template>
  <div>
    <!-- Existing blocks/components -->
    <EmptyBlock v-if="dataIsEmpty" @add-new-block="addNewBlock(0, 1)"></EmptyBlock>
    <Editor
      v-if="isEditing && currentBlockIndex !== null"
      :index="currentBlockIndex"
      :block="currentBlock"
      @update="updateBlock"
    />

    <div v-else class="content">
      <!-- 1) Insert your about-founded block here with default text/images -->

      <div class="about-founded mb-32 lg:ml-32">
        <div class="about-founded__heading heading-border--right">
          <h2>{{ sectionTitle }}</h2>
          <h3>{{ sectionSubHeading }}</h3>
        </div>
        <div class="about-founded__content">
          <div class="about-founded__content-logos-wrapper" ref="imageWrapper">
            <img
              loading="lazy"
              class="about-founded__content-logos"
              :src="image"
              alt="Logo"
              ref="logoImage"
              @load="handleImageLoad"
            />
          </div>
          <div class="about-founded__content-text">
            <div class="text-white" v-html="heading"></div>
            <h6 class="text-white">{{ subHeading }}</h6>
            <p class="text-white">{{ description }}</p>
          </div>
        </div>
      </div>

      <!-- 2) Then continue with your existing v-for to render other blocks -->
      <template v-for="(block, index) in data.blocks" :key="index">
        <PageBlock
          :index="index"
          :block="block"
          :is-preview="isPreview"
          :disable-actions="disableActions"
          :is-clicked="isClicked"
          :clicked-block-index="clickedBlockIndex"
          :is-tablet="isTablet"
          :show-newsletter="showNewsletter"
          :block-has-data="blockHasData"
          :get-component="getComponent"
          :tablet-edit="tabletEdit"
          :add-new-block="addNewBlock"
          :handle-edit="handleEdit"
          :delete-block="deleteBlock"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * 1) Imports remain the same (block manager, homepage composables, etc.).
 * 2) We replace `defineProps` with local refs that hold default values.
 */
import { ref, onMounted, onBeforeUnmount } from 'vue';
import homepageTemplateDataEn from '../composables/useHomepage/homepageTemplateDataEn.json';
import homepageTemplateDataDe from '../composables/useHomepage/homepageTemplateDataDe.json';

import { useBlockManager } from '../composables/useBlockManager';
import { useHomepage } from '../composables/useHomepage';
import { useNewsletter } from '../composables/useNewsletter';
import { useNuxtApp } from '#imports';
import { useEditor } from '../composables/useEditor';

import EmptyBlock from '../components/cmsBlocks/EmptyBlock.vue';
import Editor from '../components/Editor.vue';
import PageBlock from '../components/blocks/PageBlock.vue';

// --- Local refs with default values referencing webimpact + Plentymarkets ---
const sectionTitle = ref('Unsere Vision von webimpact, einer Agentur für Webentwicklung mit Plentymarkets');
const sectionSubHeading = ref('Wie wir gemeinsam E-Commerce revolutionieren');
const heading = ref('Deine Zukunft im Onlinehandel beginnt bei uns!');
const subHeading = ref('Wir sind dein Partner für individuelle Plentymarkets-Lösungen');
const description = ref('Mit webimpact an deiner Seite realisieren wir maßgeschneiderte E-Commerce-Projekte, genau zugeschnitten auf deine Anforderungen – inklusive vollintegrierter Plentymarkets-Anbindungen.');
const image = ref('/path/to/your/logo-image.jpg'); // Update path as needed.

// Keep your positioning logic exactly the same:
const imageWrapper = ref<HTMLElement | null>(null);
const logoImage = ref<HTMLElement | null>(null);

const adjustImagePosition = () => {
  if (!imageWrapper.value || !logoImage.value) return;

  if (window.innerWidth <= 571) {
    // Mobile centering logic
    const wrapperWidth = imageWrapper.value.offsetWidth;
    const imageWidth = logoImage.value.offsetWidth;
    const leftPosition = (wrapperWidth - imageWidth) / 2;

    logoImage.value.style.position = 'relative';
    logoImage.value.style.left = `${leftPosition}px`;
    logoImage.value.style.right = 'auto';
    logoImage.value.style.transform = 'translateX(0)';
    logoImage.value.style.top = '0';
  } else {
    // Desktop positioning
    logoImage.value.style.position = 'absolute';
    logoImage.value.style.left = '';
    logoImage.value.style.right = '';
    logoImage.value.style.transform = '';

    if (window.innerWidth > 1200) {
      logoImage.value.style.left = '-25%';
    } else {
      logoImage.value.style.left = '-17%';
    }
    logoImage.value.style.top = '-30%';
  }
};

const handleImageLoad = () => {
  adjustImagePosition();
};

const debounce = (fn: Function, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
};

const debouncedAdjustImage = debounce(adjustImagePosition, 250);

onMounted(() => {
  window.addEventListener('resize', debouncedAdjustImage);
  adjustImagePosition();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', debouncedAdjustImage);
});

// --- The rest are your existing composable calls and logic ---
const {
  currentBlock,
  currentBlockIndex,
  isClicked,
  clickedBlockIndex,
  isTablet,
  isPreview,
  blockHasData,
  tabletEdit,
  handleEdit,
  deleteBlock,
  updateBlock
} = useBlockManager();

const { data, fetchPageTemplate, dataIsEmpty } = useHomepage();
const { showNewsletter } = useNewsletter();
const { $i18n } = useNuxtApp();
const { isEditing, disableActions } = useEditor();

const defaultAddBlock = (lang: string) => {
  return lang === 'en' ? homepageTemplateDataEn.blocks[1] : homepageTemplateDataDe.blocks[1];
};

const addNewBlock = (index: number, position: number) => {
  const insertIndex = position === -1 ? index : index + 1;
  const updatedBlocks = [...data.value.blocks];

  updatedBlocks.splice(insertIndex, 0, defaultAddBlock($i18n.locale.value));
  data.value.blocks = updatedBlocks;
};

fetchPageTemplate();
</script>

<style lang="scss" scoped>
.about-founded {
  max-width: 1100px;

  .text-white>* {
    color: $white;
  }

  h6 {
    margin-bottom: 1rem;
  }

  &__heading {
    text-align: left;
    padding-bottom: 0;
    z-index: 0;
    margin-right: 1rem;

    h3 {
      margin-top: 20px;
    }

    &::after {
      content: '';
      position: absolute;
      top: 30px;
      bottom: 0;
      z-index: -1;
      background-color: var(--primary-color);
      width: 3px;
      right: -15px;
    }
  }

  &__content {
    background-color: var(--primary-color);
    color: $white;
    max-width: 1000px;
    margin-left: auto;
    margin-top: 1rem;
    position: relative;
    overflow: visible;

    &-logos-wrapper {
      position: relative;
      width: 100%;
      height: auto;
      overflow: visible;
      // Ensure wrapper maintains height in desktop view
      min-height: 200px;
    }

    &-logos {
      position: absolute;
      height: 40%;
      width: auto;
      transition: all 0.3s ease;
      z-index: 1;
    }

    &-text {
      padding: 10rem 1rem 2rem;
      position: relative;
      z-index: 0;
    }
  }
}

@media screen and (min-width: 991px) {
  .about-founded__heading {
    text-align: right;
    padding-bottom: 0;
    line-height: 130px;

    h3 {
      line-height: 70px;
    }
  }
}

@media screen and (min-width: 768px) {
  .about-founded__content {
    &-text {
      padding: 3rem 3rem 3rem 20rem;
    }
    &-logos {
      height: 150%;
      left: -25%;
      top: -30%;
      position: absolute;
    }
    &-logos-wrapper {
      position: absolute;
      height: 100%;
      width: 100%;
      top: 0;
      left: 0;
    }
  }
}

@media screen and (min-width: 576px) and (max-width: 1200px) {
  .about-founded__content {
    &-text {
      padding: 3rem 3rem 3rem 22rem;
    }
    &-logos {
      left: 1% !important;
      top: 10% !important;
      width: 100%;
      height: 100%;
      max-width: 300px;
      max-height: 300px;
      object-fit: cover;
    }
  }
}

@media screen and (max-width: 571px) {
  .about-founded__content {
    &-text {
      padding: 1rem;
    }
    &-logos-wrapper {
      position: relative;
      width: 100%;
      height: auto;
      margin-bottom: 1rem;
      min-height: auto;
    }
    &-logos {
      position: relative;
      max-width: 90%;
      height: auto;
      max-height: 300px;
      object-fit: contain;
      margin: 0 auto;
      top: 0;
    }
  }
  .about-founded__heading {
    &::after {
      display: none;
    }
  }
}
</style>
