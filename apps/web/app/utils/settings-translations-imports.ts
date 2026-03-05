import type { LocaleMessages, Messages } from '~/components/SiteConfigurationView/types';

const localeFilesCustomer = import.meta.glob('/node_modules/*/runtime/components/settings/**/lang.json', {
  eager: true,
  import: 'default',
}) as Messages;
const localeFilesRootNodeModules = import.meta.glob('~~/../../node_modules/*/runtime/components/settings/**/lang.json', {
  eager: true,
  import: 'default',
}) as Messages;
const localeFilesNuxtModules = import.meta.glob('~~/modules/*/runtime/components/settings/**/lang.json', {
  eager: true,
  import: 'default',
}) as Messages;
const localeFilesCore = import.meta.glob('@/components/**/settings/**/lang.json', {
  eager: true,
  import: 'default',
}) as Messages;

const isAppleDouble = (path: string) => path.includes('/._') || path.includes('\\._');

const normalize = (path: string) => {
  const pop = path.split('/settings/').pop();

  if (pop) {
    return pop.replace(/\.json$/, '');
  }
  return path;
};

const localeFiles: Record<string, LocaleMessages> = {};

Object.entries(localeFilesCore).forEach(([path, loader]) => {
  if (isAppleDouble(path)) return;
  localeFiles[normalize(path)] = loader;
});
Object.entries(localeFilesNuxtModules).forEach(([path, loader]) => {
  if (isAppleDouble(path)) return;
  localeFiles[normalize(path)] = loader;
});
Object.entries(localeFilesCustomer).forEach(([path, loader]) => {
  if (isAppleDouble(path)) return;
  localeFiles[normalize(path)] = loader;
});
Object.entries(localeFilesRootNodeModules).forEach(([path, loader]) => {
  if (isAppleDouble(path)) return;
  localeFiles[normalize(path)] = loader;
});

export const getSettingsTranslations = () => {
  return localeFiles;
};
