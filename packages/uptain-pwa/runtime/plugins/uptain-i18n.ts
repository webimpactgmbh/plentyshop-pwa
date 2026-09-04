import { defineNuxtPlugin } from 'nuxt/app';
import de from '../lang/de.json';
import en from '../lang/en.json';

export default defineNuxtPlugin((nuxtApp) => {
  const $i18n = nuxtApp.$i18n as { mergeLocaleMessage?: (locale: string, messages: object) => void } | undefined;

  if ($i18n?.mergeLocaleMessage) {
    $i18n.mergeLocaleMessage('de', de);
    $i18n.mergeLocaleMessage('en', en);
  }
});

