import { addPlugin, addComponentsDir, addTemplate, createResolver, defineNuxtModule } from '@nuxt/kit';
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync } from 'node:fs';
import { join, relative } from 'node:path';

const symlinkType = process.platform === 'win32' ? 'junction' : 'dir';

const linkDirectory = (source: string, target: string) => {
  if (existsSync(target)) {
    try {
      if (lstatSync(target).isSymbolicLink()) {
        rmSync(target);
      }
    } catch {
      // keep existing non-symlink target
      return;
    }
  }

  mkdirSync(join(target, '..'), { recursive: true });
  symlinkSync(source, target, symlinkType);
};

export default defineNuxtModule({
  meta: {
    name: 'uptain',
    configKey: 'uptain',
  },
  setup(_, nuxt) {
    const resolver = createResolver(import.meta.url);
    const settingsRoot = resolver.resolve('./runtime/components/settings');
    const moduleRoot = resolver.resolve('.');
    const runtimeRoot = resolver.resolve('./runtime');

    // PlentyONE Shop discovers editor settings via: ~~/modules/*/runtime/components/settings/**
    // This symlink works on stock shops without patching settings-groups-imports.
    try {
      const shopModulesRuntime = join(nuxt.options.rootDir, 'modules/uptain/runtime');
      linkDirectory(runtimeRoot, shopModulesRuntime);
    } catch (error) {
      console.warn('[uptain-pwa] Unable to link editor settings into modules/uptain:', error);
    }

    // Fallback for shops that only scan /node_modules/*/runtime/components/settings/**
    try {
      const appNodeModules = join(nuxt.options.rootDir, 'node_modules');
      const target = join(appNodeModules, 'uptain-pwa');
      if (!existsSync(appNodeModules)) {
        mkdirSync(appNodeModules, { recursive: true });
      }
      if (!existsSync(target)) {
        symlinkSync(moduleRoot, target, symlinkType);
      }
    } catch (error) {
      console.warn('[uptain-pwa] Unable to create node_modules symlink:', error);
    }

    const uptainPublicDefaults = {
      uptainId: process.env.NUXT_PUBLIC_UPTAIN_ID || '',
      uptainEnabled: process.env.NUXT_PUBLIC_UPTAIN_ENABLED === '1' ? '1' : '0',
      uptainBlockCookiesInitially: process.env.NUXT_PUBLIC_UPTAIN_BLOCK_COOKIES_INITIALLY === 'true' ? '1' : '0',
      uptainTransmitNewsletterData: process.env.NUXT_PUBLIC_UPTAIN_TRANSMIT_NEWSLETTER_DATA === 'true' ? '1' : '0',
      uptainTransmitCustomerData: process.env.NUXT_PUBLIC_UPTAIN_TRANSMIT_CUSTOMER_DATA === 'true' ? '1' : '0',
      uptainTransmitRevenue: process.env.NUXT_PUBLIC_UPTAIN_TRANSMIT_REVENUE === 'true' ? '1' : '0',
      uptainCookieGroup: process.env.NUXT_PUBLIC_UPTAIN_COOKIE_GROUP || 'CookieBar.marketing.label',
      uptainConsentManagerVendorId: process.env.NUXT_PUBLIC_UPTAIN_CONSENT_MANAGER_VENDOR_ID || '',
      uptainDebugMode: process.env.NUXT_PUBLIC_UPTAIN_DEBUG_MODE === '1' ? '1' : '0',
    };

    nuxt.options.runtimeConfig.public = {
      ...uptainPublicDefaults,
      ...nuxt.options.runtimeConfig.public,
    };

    addPlugin(resolver.resolve('./runtime/plugins/uptain-cookie-registration.server'));
    addPlugin(resolver.resolve('./runtime/plugins/uptain-i18n'));
    addPlugin(resolver.resolve('./runtime/plugins/uptain.client'));
    addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      pathPrefix: false,
    });

    const addSettingsTemplates = (dir: string) => {
      const entries = readdirSync(dir, { withFileTypes: true });
      entries.forEach((entry) => {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          addSettingsTemplates(fullPath);
          return;
        }
        if (!entry.isFile()) return;
        if (!fullPath.endsWith('.vue') && !fullPath.endsWith('lang.json')) return;

        const rel = relative(settingsRoot, fullPath).split('\\').join('/');
        addTemplate({
          filename: `modules/uptain/runtime/components/settings/${rel}`,
          getContents: () => readFileSync(fullPath, 'utf8'),
        });
      });
    };

    if (statSync(settingsRoot, { throwIfNoEntry: false })?.isDirectory()) {
      addSettingsTemplates(settingsRoot);
    }
  },
});
