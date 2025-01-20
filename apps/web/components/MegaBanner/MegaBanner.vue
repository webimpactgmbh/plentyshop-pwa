<template>
  <div class="flex flex-col md:flex-row flex-wrap gap-6 max-w-[1540px]">
    <div
      v-for="{
        image,
        title,
        subtitle,
        description,
        buttonText,
        backgroundColor,
        reverse,
        titleClass,
        subtitleClass,
      } in displayDetails"
      :key="image"
      :class="[
        'relative flex md:max-w-[1536px] md:[&:not(:first-of-type)]:flex-1 md:first-of-type:w-full',
        backgroundColor,
      ]"
    >
      <a
        class="absolute w-full h-full z-1 focus-visible:outline focus-visible:rounded-lg"
        :aria-label="title || 'Image'"
        href="#"
      />
      <div 
        :class="[
          'flex justify-between overflow-hidden grow', 
          { 'flex-row-reverse': reverse, 'w-full': !title && !subtitle && !description && !buttonText }
        ]"
      >
        <div 
          v-if="title || subtitle || description || buttonText" 
          class="flex flex-col justify-center items-start p-6 lg:p-10 max-w-1/2"
        >
          <p v-if="subtitle" :class="['uppercase typography-text-xs block font-bold tracking-widest', subtitleClass]">
            {{ subtitle }}
          </p>
          <h2 v-if="title" :class="['mb-4 mt-2 font-bold typography-display-3', titleClass]">
            {{ title }}
          </h2>
          <p v-if="description" class="typography-text-base block mb-4">
            {{ description }}
          </p>
          <SfButton v-if="buttonText" class="!bg-black">{{ buttonText }}</SfButton>
        </div>
        <img 
          :src="image" 
          :alt="title || 'Image'" 
          :class="[title || subtitle || description || buttonText ? 'w-1/2 self-end object-contain' : 'w-full']"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { SfButton } from '@storefront-ui/vue';

const displayDetails = [
  {
    image: 'https://cdn02.plentymarkets.com/ecug9gl4m08u/frontend/assets/img/pwa/ball-chair-isolated-transparent-background_191095-12846-removebg-preview.png',
    title: 'Futuristic Furniture Shop with webimpact',
    subtitle: 'Be inspired',
    description: 'We can make your design come true',
    buttonText: 'Discover now',
    reverse: false,
    backgroundColor: 'bg-negative-200',
    titleClass: 'md:typography-display-2',
    subtitleClass: 'md:typography-headline-6',
  },
  {
    image: 'https://cdn02.plentymarkets.com/ecug9gl4m08u/frontend/assets/img/pwa/png-indoor-plant-leaf-white-background-houseplant_53876-201098-removebg-preview.png',
    title: 'Modern design with custom components',
    subtitle: 'Take Control!',
    description: 'Explore the components we can make for you!',
    buttonText: 'Discover now',
    reverse: true,
    backgroundColor: 'bg-warning-200',
  },
  {
    image: 'https://cdn02.plentymarkets.com/ecug9gl4m08u/frontend/assets/img/pwa/modern-chairs-with-wooden-table_53876-200730-removebg-preview.png',
    title: '',
    subtitle: '',
    description: '',
    buttonText: '',
    reverse: false,
    backgroundColor: 'bg-secondary-200',
  },
];
</script>
