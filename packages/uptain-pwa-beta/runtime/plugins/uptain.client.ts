import { defineNuxtPlugin } from 'nuxt/app';
import {
  useAddressStore,
  useCart,
  useCartShippingMethods,
  useCategoryFilter,
  useCategoryTree,
  useCookie,
  useCookieBar,
  useCustomer,
  useCustomerOrders,
  useLocalePath,
  usePaymentMethods,
  usePlentyEvent,
  useProducts,
  useRoute,
  useRuntimeConfig,
  useSearch,
  useSiteSettings,
  useState,
  useWishlist,
} from '#imports';
import { nextTick, watch } from 'vue';
import { useUptainData } from '../composables/useUptainData';
import type { UptainContext } from '../types/uptain-context';
import { parseWishlistDebugRows, tryParseJson } from '../utils/debugAttributeParsers';
import { useProduct } from '~/composables/useProduct/useProduct';
import { createProductParams } from '~/utils/productHelper';
import { productGetters } from '@plentymarkets/shop-api';
import type { Cart } from '@plentymarkets/shop-api';
import type { CookieGroup } from '@plentymarkets/shop-core';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.runWithContext(() => {
    const route = useRoute();
    const runtimeConfig = useRuntimeConfig();
    const context: UptainContext = {
      getRoute: () => route,
      getRuntimeConfig: () => runtimeConfig,
      getState: (key, init) => useState(key, init),
      useCustomer: () => useCustomer(),
      useWishlist: () => useWishlist(),
      getSiteSetting: (key) => {
        const { getSetting } = useSiteSettings(key);
        return getSetting;
      },
      getLocalePath: (path) => useLocalePath()(path),
      useProducts: () => useProducts(),
      useCart: () => useCart(),
      useAddressStore: (type) => useAddressStore(type),
      useCartShippingMethods: () => useCartShippingMethods(),
      usePaymentMethods: () => usePaymentMethods(),
      useCategoryTree: () => useCategoryTree(),
      useCategoryFilter: () => useCategoryFilter(),
      useSearch: () => useSearch(),
      useCustomerOrders: () => useCustomerOrders(),
    };
    const { getAllData, shouldBlockCookies, getUptainId } = useUptainData(context);
    const { getSetting: getUptainEnabled } = useSiteSettings('uptainEnabled');
    const { getSetting: getDebugMode } = useSiteSettings('uptainDebugMode');

    // Get cookie groups - useCookieBar is auto-imported
    const { cookieGroups } = useCookieBar();

  // Helper function to check if a setting value is enabled
  // Handles string/number/boolean values from runtime config or site settings.
  const isSettingEnabled = (value: string | number | boolean | undefined | null): boolean => {
    if (value === true || value === 1) return true;
    if (value === false || value === 0 || value == null) return false;
    if (typeof value === 'string') return value === 'true' || value === '1';
    return false;
  };

  const getValidUptainId = (): string => {
    const id = getUptainId();
    if (!id || id === 'XXXXXXXXXXXXXXXX') return '';
    return id;
  };

  const removeUptainScript = () => {
    const existingScript = document.getElementById('__up_data_qp');
    if (existingScript) {
      existingScript.remove();
    }
  };

  const logScriptData = (script: HTMLElement | null) => {
    if (typeof window === 'undefined' || !window.__UPTAIN_DEBUG__) return;
    if (!script) return;

    const attributes = script.getAttributeNames().filter((name) => name.startsWith('data-'));
    if (attributes.length === 0) {
      return;
    }

    const extraTables: Array<{ title: string; rows: Array<Record<string, unknown>> }> = [];

    const rows = attributes.map((attr) => {
      const value = script.getAttribute(attr) ?? '';
      const key = attr.replace(/^data-/, '');

      if (key === 'category-products' && value) {
        const parsed = tryParseJson(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const items = Object.entries(parsed as Record<string, unknown>).map(([id, data]) => ({
            id,
            ...(data as Record<string, unknown>),
          }));
          if (items.length > 0) {
            extraTables.push({ title: 'category-products', rows: items });
            return { key, value: `[${items.length} items]` };
          }
        }
      }

      if (key === 'wishlist' && value) {
        const rows = parseWishlistDebugRows(value);
        if (rows && rows.length > 0) {
          extraTables.push({ title: 'wishlist', rows });
          return { key, value: `[${rows.length} items]` };
        }
      }

      return { key, value };
    });

    console.groupCollapsed(
      '%cUptain Debug%c data-* attributes',
      'background:#111;color:#31b9b5;padding:2px 6px;border-radius:4px;',
      'color:#9ca3af;',
    );
    console.table(rows);
    
    // Check product-variants specifically
    const productVariants = script.getAttribute('data-product-variants');
    if (productVariants !== null) {
      console.log('%c[Uptain] data-product-variants:', 'color: #fbbf24; font-weight: bold;', productVariants || '(empty string)');
    } else {
      console.log('%c[Uptain] data-product-variants:', 'color: #ef4444; font-weight: bold;', 'NOT SET');
    }
    
    extraTables.forEach(({ title, rows: tableRows }) => {
      console.groupCollapsed(`%c${title}`, 'background:#111;color:#fbbf24;padding:2px 6px;border-radius:4px;');
      console.table(tableRows);
      console.groupEnd();
    });
    console.groupEnd();
  };

  const setDebugFlag = () => {
    if (typeof window === 'undefined') return;
    window.__UPTAIN_DEBUG__ = isSettingEnabled(getDebugMode());
    if (window.__UPTAIN_DEBUG__) {
      logScriptData(document.getElementById('__up_data_qp'));
    }
  };

  const loadUptainScript = async () => {
    console.log('[Uptain] loadUptainScript called');
    const uptainId = getValidUptainId();
    if (!uptainId) {
      console.warn('[Uptain] No valid Uptain ID set, script not loaded');
      removeUptainScript();
      return;
    }
    
    // Get product if on product page – wait for it so script is created with product data on first load
    let product = null;
    if (process.client && route.path.includes('/product/')) {
      const itemId = route.params.itemId as string;
      if (itemId) {
        const { productParams } = createProductParams(route.params);
        const productId = productParams.id.toString();
        if (productId) {
          const getProductFromAllSources = () => {
            const { currentProduct } = useProducts();
            const { productForEditor, data: productData } = useProduct(productId);
            return currentProduct.value && Object.keys(currentProduct.value).length > 0
              ? currentProduct.value
              : (productForEditor.value && Object.keys(productForEditor.value).length > 0
                ? productForEditor.value
                : (productData.value && Object.keys(productData.value).length > 0
                  ? productData.value
                  : null));
          };

          product = getProductFromAllSources();
          if (!product || Object.keys(product).length === 0) {
            const maxWaitMs = 4000;
            const pollIntervalMs = 100;
            const start = Date.now();
            while (Date.now() - start < maxWaitMs) {
              await new Promise((r) => setTimeout(r, pollIntervalMs));
              product = getProductFromAllSources();
              if (product && Object.keys(product).length > 0) {
                console.log('[Uptain] Product available after', Date.now() - start, 'ms, creating script with product data');
                break;
              }
            }
            if (!product || Object.keys(product).length === 0) {
              console.log('[Uptain] Product not available after', maxWaitMs, 'ms, creating script without product data (will update on frontend:productLoaded)');
              product = null;
            }
          } else {
            console.log('[Uptain] Product found immediately on initial load');
          }
        }
      }
    }

    const data = await getAllData(product);
    console.log('[Uptain] getAllData returned:', data ? 'data exists' : 'null', 'hasProductData:', data && Object.keys(data).some(k => k.startsWith('product-')));
    if (!data) {
      console.warn('[Uptain] No data returned from getAllData, script not loaded');
      return;
    }

    // Remove existing script if any
    removeUptainScript();

    // Create script element with all data attributes
    const script = document.createElement('script');
    script.id = '__up_data_qp';
    script.type = 'text/javascript';
    script.src = `https://app.uptain.de/js/uptain.js?x=${uptainId}`;
    script.async = true;

    // Add all data attributes
    let productAttributesInScript = 0;
    // Personal data fields that should always be set (even if empty)
    const personalDataFields = ['email', 'firstname', 'lastname', 'gender', 'title', 'uid', 'revenue', 'customergroup'];
    
    Object.entries(data).forEach(([key, value]) => {
      // Always set product-variants, even if empty (it's a required field)
      if (key === 'product-variants') {
        script.setAttribute(`data-${key}`, String(value || ''));
        productAttributesInScript++;
      } else if (personalDataFields.includes(key)) {
        // Always set personal data fields, even if empty (as per Uptain spec)
        script.setAttribute(`data-${key}`, String(value || ''));
      } else if (value && value !== '') {
        script.setAttribute(`data-${key}`, String(value));
        if (key.startsWith('product-')) {
          productAttributesInScript++;
        }
      }
    });
    console.log('[Uptain] Script created with', productAttributesInScript, 'product attributes');

    // Append to body
    document.body.appendChild(script);
    console.log('[Uptain] Script appended to body:', script.src);
    logScriptData(script);
    
    // Start interval to check and update missing product attributes on product pages
    if (process.client && route.path.includes('/product/')) {
      const expectedProductAttributes = [
        'product-id',
        'product-name',
        'product-price',
        'product-original-price',
        'product-image',
        'product-tags',
        'product-variants',
        'product-category',
        'product-category-paths',
        'product',
      ];
      
      let attributeCheckInterval: ReturnType<typeof setInterval> | null = null;
      let checkCount = 0;
      const maxChecks = 75; // Check for up to 15 seconds (75 * 200ms)
      
      const checkAndUpdateAttributes = async () => {
        checkCount++;
        if (checkCount > maxChecks) {
          if (attributeCheckInterval) {
            clearInterval(attributeCheckInterval);
            attributeCheckInterval = null;
            console.log('[Uptain] Stopped attribute check interval after max checks');
          }
          return;
        }
        
        const currentScript = document.getElementById('__up_data_qp') as HTMLScriptElement;
        if (!currentScript) {
          return;
        }
        
        // Check which attributes are missing
        const missingAttributes: string[] = [];
        expectedProductAttributes.forEach(attr => {
          const dataAttr = `data-${attr}`;
          if (!currentScript.hasAttribute(dataAttr) || currentScript.getAttribute(dataAttr) === '') {
            missingAttributes.push(attr);
          }
        });
        
        if (missingAttributes.length > 0) {
          console.log('[Uptain] Missing product attributes detected:', missingAttributes);
          
          // Try to get product and update attributes
          const itemId = route.params.itemId as string;
          let product: any = null;
          
          if (itemId) {
            const { productParams } = createProductParams(route.params);
            const productId = productParams.id.toString();
            if (productId) {
              const { currentProduct } = useProducts();
              const { productForEditor, data: productData } = useProduct(productId);
              
              product = currentProduct.value && Object.keys(currentProduct.value).length > 0
                ? currentProduct.value
                : (productForEditor.value && Object.keys(productForEditor.value).length > 0
                  ? productForEditor.value
                  : (productData.value && Object.keys(productData.value).length > 0
                    ? productData.value
                    : null));
            }
          }
          
          if (product && Object.keys(product).length > 0) {
            console.log('[Uptain] Product found, updating missing attributes:', missingAttributes);
            const productData = await getAllData(product);
            if (productData) {
              let attributesUpdated = 0;
              missingAttributes.forEach(attr => {
                const value = productData[attr];
                if (value !== undefined && value !== null && value !== '') {
                  currentScript.setAttribute(`data-${attr}`, String(value));
                  attributesUpdated++;
                  console.log(`[Uptain] Updated missing attribute: ${attr} = ${value}`);
                }
              });
              
              if (attributesUpdated > 0) {
                console.log(`[Uptain] Updated ${attributesUpdated} missing product attributes`);
                logScriptData(currentScript);
                
                // If all attributes are now set, stop the interval
                const stillMissing = expectedProductAttributes.filter(attr => {
                  const dataAttr = `data-${attr}`;
                  return !currentScript.hasAttribute(dataAttr) || currentScript.getAttribute(dataAttr) === '';
                });
                
                if (stillMissing.length === 0) {
                  if (attributeCheckInterval) {
                    clearInterval(attributeCheckInterval);
                    attributeCheckInterval = null;
                    console.log('[Uptain] All product attributes are set, stopped check interval');
                  }
                }
              }
            }
          }
        } else {
          // All attributes are present, stop checking
          if (attributeCheckInterval) {
            clearInterval(attributeCheckInterval);
            attributeCheckInterval = null;
            console.log('[Uptain] All product attributes are set, stopped check interval');
          }
        }
      };
      
      // Start checking every 200ms
      attributeCheckInterval = setInterval(checkAndUpdateAttributes, 200);
      console.log('[Uptain] Started attribute check interval for product page');
      
      // Clean up interval on route change
      const stopInterval = () => {
        if (attributeCheckInterval) {
          clearInterval(attributeCheckInterval);
          attributeCheckInterval = null;
          console.log('[Uptain] Stopped attribute check interval on route change');
        }
      };
      
      // Stop interval when route changes
      watch(() => route.path, () => {
        stopInterval();
      });
    }
    
    // If on product page and product not found (or empty), wait for it and update script
    const hasValidProduct = product && Object.keys(product).length > 0;
    if (process.client && route.path.includes('/product/') && !hasValidProduct) {
      console.log('[Uptain] Starting background check for product...', { hasProduct: !!product, productKeys: product ? Object.keys(product).length : 0 });
      const itemId = route.params.itemId as string;
      if (itemId) {
        const { productParams } = createProductParams(route.params);
        const productId = productParams.id.toString();
        if (productId) {
          console.log('[Uptain] Product not found on initial load, starting background check...');
          
          // Wait for product and update script (non-blocking, but more aggressive)
          (async () => {
            const getProductFromAllSources = () => {
              const { currentProduct } = useProducts();
              const { productForEditor, data: productData } = useProduct(productId);
              
              return currentProduct.value && Object.keys(currentProduct.value).length > 0
                ? currentProduct.value
                : (productForEditor.value && Object.keys(productForEditor.value).length > 0
                  ? productForEditor.value
                  : (productData.value && Object.keys(productData.value).length > 0
                    ? productData.value
                    : null));
            };
            
            const startTime = Date.now();
            const maxWait = 15000; // 15 seconds
            const checkInterval = 200; // Check every 200ms
            
            while ((Date.now() - startTime) < maxWait) {
              await new Promise(resolve => setTimeout(resolve, checkInterval));
              
              const foundProduct = getProductFromAllSources();
              if (foundProduct && Object.keys(foundProduct).length > 0) {
                const waitTime = Date.now() - startTime;
                console.log(`[Uptain] Background check: Product found after ${waitTime}ms, updating script with product data`);
                
                const currentScript = document.getElementById('__up_data_qp');
                if (currentScript) {
                  const productData = await getAllData(foundProduct);
                  if (productData) {
                    let attributesSet = 0;
                    Object.entries(productData).forEach(([key, value]) => {
                      if (key.startsWith('product-') || key === 'product') {
                        if (key === 'product-variants') {
                          currentScript.setAttribute(`data-${key}`, String(value || ''));
                          attributesSet++;
                        } else if (value && value !== '') {
                          currentScript.setAttribute(`data-${key}`, String(value));
                          attributesSet++;
                        }
                      }
                    });
                    console.log(`[Uptain] Background check: Set ${attributesSet} product attributes`);
                    logScriptData(currentScript);
                    if (window._upEventBus) {
                      window._upEventBus.publish('uptain.readData');
                    }
                  }
                } else {
                  console.warn('[Uptain] Background check: Script not found, cannot update');
                }
                break; // Product found and updated, stop waiting
              }
            }
            
            if ((Date.now() - startTime) >= maxWait) {
              console.warn('[Uptain] Background check: Product not found after 15 seconds');
            }
          })();
        }
      }
    }

    // Initialize event bus if not exists
    if (typeof window !== 'undefined' && !window._upEventBus) {
      window._upEventBus = {
        publish: (event: string) => {
          if (event === 'uptain.readData') {
            // Reload script to read updated data
            const currentScript = document.getElementById('__up_data_qp');
            if (currentScript) {
              const newScript = currentScript.cloneNode(true) as HTMLScriptElement;
              currentScript.remove();
              document.body.appendChild(newScript);
            }
          }
        },
      };
    }
  };

  const checkCookieConsent = (): boolean => {
    if (!shouldBlockCookies()) return true;

    const groupName = (runtimeConfig.public.uptainCookieGroup as string | undefined) || 'CookieBar.marketing.label';
    const rawConsent = consentCookie.value ?? null;
    const storedConsent = getStoredUptainConsent(groupName, rawConsent);

    if (storedConsent !== null) {
      return storedConsent;
    }

    // If a consent cookie exists (user clicked a button), fall back to group acceptance.
    if (rawConsent) {
      const group = cookieGroups.value?.find((cookieGroup: CookieGroup) => cookieGroup.name === groupName);
      return group?.accepted ?? false;
    }

    // Opt-in only: no consent cookie yet -> no consent.
    return false;
  };

  const consentCookie = useCookie<string>('consent-cookie');
  let lastConsentSnapshot: string | null = consentCookie.value ?? null;
  let isUpdatingConsentCookie = false;
  let lastUptainSelection: boolean | null = null;

  const getStoredUptainConsent = (groupName: string, rawConsent: string | null): boolean | null => {
    if (!rawConsent) return null;
    try {
      const parsed = JSON.parse(rawConsent);
      const stored = parsed?.groups?.[groupName]?.['CookieBar.uptain.cookies.uptain.name'];
      return typeof stored === 'boolean' ? stored : null;
    } catch {
      return null;
    }
  };

  const persistUptainConsent = (groupName: string, accepted: boolean) => {
    const rawConsent = consentCookie.value;
    if (!rawConsent) return;
    try {
      const parsed = JSON.parse(rawConsent);
      const groups = parsed?.groups ?? {};
      const group = groups[groupName] ?? {};

      if (group['CookieBar.uptain.cookies.uptain.name'] === accepted) {
        return;
      }

      group['CookieBar.uptain.cookies.uptain.name'] = accepted;
      groups[groupName] = group;
      parsed.groups = groups;

      const nextValue = JSON.stringify(parsed);
      if (nextValue !== rawConsent) {
        isUpdatingConsentCookie = true;
        consentCookie.value = nextValue;
        lastConsentSnapshot = nextValue;
        nextTick(() => {
          isUpdatingConsentCookie = false;
        });
      }
    } catch {
      // ignore malformed consent cookie
    }
  };

  const captureUptainSelection = () => {
    const groups = cookieGroups.value;
    if (!groups) return;
    const uptainCookie = groups
      .flatMap((group) => group.cookies || [])
      .find((cookie) => cookie.name === 'CookieBar.uptain.cookies.uptain.name');
    if (typeof uptainCookie?.accepted === 'boolean') {
      lastUptainSelection = uptainCookie.accepted;
    }
  };

  const syncCookieConsentState = () => {
    const groups = cookieGroups.value;
    if (!groups) return;

    const groupName = (runtimeConfig.public.uptainCookieGroup as string | undefined) || 'CookieBar.marketing.label';
    const rawConsent = consentCookie.value ?? null;
    const hasConsentChanged = rawConsent !== lastConsentSnapshot;
    const storedConsent = getStoredUptainConsent(groupName, rawConsent);

    const uptainCookie = groups
      .flatMap((group) => group.cookies || [])
      .find((cookie) => cookie.name === 'CookieBar.uptain.cookies.uptain.name');

    if (!uptainCookie) return;

    const desiredStatus = 'CookieBar.uptain.cookies.uptain.status';
    const desiredAccepted = storedConsent !== null ? storedConsent : false;

    if (uptainCookie.Status !== desiredStatus) {
      uptainCookie.Status = desiredStatus;
    }
    if (storedConsent !== null && uptainCookie.accepted !== desiredAccepted) {
      uptainCookie.accepted = desiredAccepted;
    }

    const uptainGroup = groups.find((group) =>
      (group.cookies || []).some((cookie) => cookie.name === uptainCookie.name),
    );
    if (uptainGroup && storedConsent !== null && hasConsentChanged) {
      uptainGroup.accepted = (uptainGroup.cookies || []).some((cookie) => cookie.accepted);
    }

    // If consent cookie changed but Uptain is missing, persist the current selection
    if (hasConsentChanged && storedConsent === null) {
      const selection = lastUptainSelection ?? !!uptainCookie.accepted;
      persistUptainConsent(groupName, selection);
    }

    if (hasConsentChanged && !isUpdatingConsentCookie) {
      lastConsentSnapshot = rawConsent;
    }
  };

  // Load script on client and keep it in sync with settings/route
  if (process.client) {
    const syncUptainScript = async () => {
      const enabled = isSettingEnabled(getUptainEnabled());
      const uptainId = getValidUptainId();
      const shouldBlock = shouldBlockCookies();
      const hasConsent = checkCookieConsent();

      // Debug logging
      console.log('[Uptain] Sync - Enabled:', enabled, 'ID set:', !!uptainId, 'Should block:', shouldBlock, 'Has consent:', hasConsent);

      if (enabled && uptainId && (!shouldBlock || hasConsent)) {
        await loadUptainScript();
      } else {
        removeUptainScript();
      }
    };

    const scheduleSync = () => {
      void nextTick().then(() => syncUptainScript());
    };

    // Watch for Uptain enabled/disabled, ID or cookie group changes
    watch(
      [() => getUptainEnabled(), () => getUptainId(), () => shouldBlockCookies()],
      () => {
        scheduleSync();
        syncCookieConsentState();
      },
      { immediate: true },
    );

    watch(
      () => getDebugMode(),
      () => {
        setDebugFlag();
      },
      { immediate: true },
    );

    // Watch for cookie consent changes
    watch(
      () => cookieGroups.value,
      () => {
        captureUptainSelection();
        scheduleSync();
        syncCookieConsentState();
      },
      { deep: true },
    );

    // Watch for consent cookie changes (after user confirms selection)
    watch(
      () => consentCookie.value,
      () => {
        if (isUpdatingConsentCookie) return;
        syncCookieConsentState();
        scheduleSync();
      },
    );

    // Helper function to get product data
    const getProductFromState = () => {
      if (!route.path.includes('/product/')) return null;
      
      // Try to get product from useProducts first (set on product page)
      const { currentProduct } = useProducts();
      if (currentProduct.value && Object.keys(currentProduct.value).length > 0) {
        return currentProduct.value;
      }
      
      // Fallback: Extract productId from route params (itemId contains the product ID)
      const itemId = route.params.itemId as string;
      if (itemId) {
        const { productParams } = createProductParams(route.params);
        const productId = productParams.id.toString();
        if (productId) {
          const { productForEditor, data: productData } = useProduct(productId);
          // Use productForEditor if available, otherwise fall back to data
          return productForEditor.value && Object.keys(productForEditor.value).length > 0 
            ? productForEditor.value 
            : (productData.value && Object.keys(productData.value).length > 0 ? productData.value : null);
        }
      }
      
      return null;
    };

    // Watch for route changes to update data
    watch(
      () => route.path,
      async () => {
        const enabled = isSettingEnabled(getUptainEnabled());
        const uptainId = getValidUptainId();
        if (!enabled || !uptainId) {
          removeUptainScript();
          return;
        }
        if (!shouldBlockCookies() || checkCookieConsent()) {
          let product = getProductFromState();
          // On product page: wait for product so we don't overwrite with null (product loads async)
          if (route.path.includes('/product/') && (!product || Object.keys(product).length === 0)) {
            const itemId = route.params.itemId as string;
            if (itemId) {
              const { productParams } = createProductParams(route.params);
              const productId = productParams.id.toString();
              if (productId) {
                const maxWaitMs = 3000;
                const pollIntervalMs = 80;
                const start = Date.now();
                while (Date.now() - start < maxWaitMs) {
                  await new Promise((r) => setTimeout(r, pollIntervalMs));
                  product = getProductFromState();
                  if (product && Object.keys(product).length > 0) break;
                }
              }
            }
          }

          // On confirmation/success page: wait for order so personal data (email etc.) is available
          if (route.path.includes('/confirmation/')) {
            const maxWaitMs = 3000;
            const pollIntervalMs = 80;
            const start = Date.now();
            while (Date.now() - start < maxWaitMs) {
              const orderState = useState<{ data?: unknown | null }>('useCustomerOrder-soft-login', () => ({ data: null }));
              if (orderState.value?.data) break;
              await new Promise((r) => setTimeout(r, pollIntervalMs));
            }
          }

          // Update script with new data
          const currentScript = document.getElementById('__up_data_qp');
          if (currentScript) {
            const data = await getAllData(product);
            if (data) {
              // Define attributes that should always be present (Table A)
              const alwaysPresentAttributes = ['plugin', 'returnurl', 'page', 'wishlist'];
              const personalDataFields = ['email', 'firstname', 'lastname', 'gender', 'title', 'uid', 'revenue', 'customergroup'];
              
              // Get all existing data-* attributes
              const existingAttributes = Array.from(currentScript.getAttributeNames())
                .filter(name => name.startsWith('data-'))
                .map(name => name.replace(/^data-/, ''));
              
              // Remove all attributes that are not in the new data and not in Table A
              existingAttributes.forEach(attr => {
                if (!alwaysPresentAttributes.includes(attr) && !(attr in data)) {
                  currentScript.removeAttribute(`data-${attr}`);
                }
              });
              
              // Set or update all attributes from new data
              Object.entries(data).forEach(([key, value]) => {
                // Always set product-variants, even if empty (it's a required field)
                if (key === 'product-variants') {
                  currentScript.setAttribute(`data-${key}`, String(value || ''));
                } else if (personalDataFields.includes(key)) {
                  currentScript.setAttribute(`data-${key}`, String(value || ''));
                } else if (value && value !== '') {
                  currentScript.setAttribute(`data-${key}`, String(value));
                } else {
                  // Only remove if not in Table A (Table A attributes should always be present)
                  if (!alwaysPresentAttributes.includes(key)) {
                    currentScript.removeAttribute(`data-${key}`);
                  }
                }
              });
              
              logScriptData(currentScript);
              // Trigger data read
              if (window._upEventBus) {
                window._upEventBus.publish('uptain.readData');
              }
            }
          } else {
            await loadUptainScript();
          }
        }
      },
    );

    // Refresh all script data and trigger uptain.readData (e.g. after cart change without page reload).
    // When cartFromEvent is passed (e.g. from frontend:addToCart), that cart is used so data is always current.
    const refreshScriptDataAndNotifyUptain = async (cartFromEvent?: Cart | null) => {
      if (!isSettingEnabled(getUptainEnabled()) || !getValidUptainId()) {
        console.log('[Uptain] refreshScriptDataAndNotifyUptain skip: not enabled or no ID');
        return;
      }
      const blockCookies = shouldBlockCookies();
      const hasConsent = checkCookieConsent();
      // Nur überspringen, wenn Consent nötig ist und (noch) nicht erteilt wurde.
      if (blockCookies && !hasConsent) {
        console.log('[Uptain] refreshScriptDataAndNotifyUptain skip: no consent yet', { blockCookies, hasConsent });
        return;
      }
      const currentScript = document.getElementById('__up_data_qp');
      if (!currentScript) {
        console.log('[Uptain] refreshScriptDataAndNotifyUptain skip: script #__up_data_qp not found');
        return;
      }
      const product = getProductFromState();
      const data = await getAllData(product, cartFromEvent ?? undefined);
      if (!data) {
        console.log('[Uptain] refreshScriptDataAndNotifyUptain skip: getAllData returned null');
        return;
      }
      if (data.products !== undefined) {
        const preview = String(data.products);
        console.log('[Uptain] refreshScriptDataAndNotifyUptain setting data-products, length:', preview.length, 'preview:', preview.length > 80 ? preview.slice(0, 80) + '...' : preview);
      }
      const alwaysPresentAttributes = ['plugin', 'returnurl', 'page', 'wishlist'];
      const personalDataFields = ['email', 'firstname', 'lastname', 'gender', 'title', 'uid', 'revenue', 'customergroup'];
      const existingAttributes = Array.from(currentScript.getAttributeNames())
        .filter((name) => name.startsWith('data-'))
        .map((name) => name.replace(/^data-/, ''));
      existingAttributes.forEach((attr) => {
        if (!alwaysPresentAttributes.includes(attr) && !(attr in data)) {
          currentScript.removeAttribute(`data-${attr}`);
        }
      });
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'product-variants') {
          currentScript.setAttribute(`data-${key}`, String(value || ''));
        } else if (personalDataFields.includes(key)) {
          currentScript.setAttribute(`data-${key}`, String(value || ''));
        } else if (value && value !== '') {
          currentScript.setAttribute(`data-${key}`, String(value));
        } else if (!alwaysPresentAttributes.includes(key)) {
          currentScript.removeAttribute(`data-${key}`);
        }
      });
      logScriptData(currentScript);
      if (window._upEventBus) {
        window._upEventBus.publish('uptain.readData');
      }
    };

    // Cart polling: prüft im Hintergrund in einem Intervall, ob sich der Warenkorb geändert hat.
    // Nur bei Änderung wird das Uptain-Script aktualisiert – keine Events nötig, alles im Modul.
    if (process.client) {
      const { on: onPlentyEvent } = usePlentyEvent();
      const cartState = useState<{ data?: Cart }>('useCart', () => ({ data: {} as Cart, useAsShippingAddress: true, loading: false, lastUpdatedCartItem: {} }));
      const confirmationOrderState = useState<{ data?: unknown | null }>('useCustomerOrder-soft-login', () => ({ data: null }));

      // When confirmation order loads (async), refresh so email/firstname/lastname are sent on success page
      watch(
        () => confirmationOrderState.value?.data,
        (order) => {
          if (!order || !route.path.includes('/confirmation/')) return;
          void refreshScriptDataAndNotifyUptain();
        },
      );

      const getCartSignature = (cart: Cart | undefined) => {
        if (!cart?.items?.length) return '';
        return cart.items
          .map((i: { id?: number; variationId?: number; quantity?: number }) => `${i?.id ?? i?.variationId ?? ''}:${i?.quantity ?? 0}`)
          .sort()
          .join('|');
      };

      let lastCartSignature = getCartSignature(cartState.value?.data);
      const CART_POLL_INTERVAL_MS = 1500;

      setInterval(() => {
        const cart = cartState.value?.data;
        const signature = getCartSignature(cart);
        if (signature === lastCartSignature) return;
        lastCartSignature = signature;
        void refreshScriptDataAndNotifyUptain(cart ?? undefined);
      }, CART_POLL_INTERVAL_MS);

      // Function to update product data in script
      const updateProductDataInScript = async (product: any) => {
        if (!product || Object.keys(product).length === 0) {
          console.warn('[Uptain] updateProductDataInScript: product is empty');
          return;
        }
        
        const enabled = isSettingEnabled(getUptainEnabled());
        const uptainId = getValidUptainId();
        if (!enabled || !uptainId) {
          console.warn('[Uptain] updateProductDataInScript: not enabled or no ID');
          return;
        }
        if (shouldBlockCookies() && !checkCookieConsent()) {
          console.warn('[Uptain] updateProductDataInScript: no consent yet');
          return;
        }
        
        console.log('[Uptain] updateProductDataInScript called with product:', product);
        const currentScript = document.getElementById('__up_data_qp');
        if (currentScript) {
          const data = await getAllData(product);
          console.log('[Uptain] getAllData returned:', data);
          if (data) {
            // Update product-related attributes
            let productAttributesSet = 0;
            Object.entries(data).forEach(([key, value]) => {
              if (key.startsWith('product-') || key === 'product') {
                // Always set product-variants, even if empty (it's a required field)
                if (key === 'product-variants') {
                  currentScript.setAttribute(`data-${key}`, String(value || ''));
                  console.log('[Uptain] Set product attribute:', key, value || '');
                  productAttributesSet++;
                } else if (value && value !== '') {
                  currentScript.setAttribute(`data-${key}`, String(value));
                  console.log('[Uptain] Set product attribute:', key, value);
                  productAttributesSet++;
                }
              }
            });
            console.log('[Uptain] Total product attributes set:', productAttributesSet);
            
            logScriptData(currentScript);
            // Trigger data read
            if (window._upEventBus) {
              window._upEventBus.publish('uptain.readData');
            }
          } else {
            console.warn('[Uptain] updateProductDataInScript: getAllData returned null/undefined');
          }
        } else {
          console.warn('[Uptain] updateProductDataInScript: script not found, will be created on next route change');
          // Don't reload script here - it will be created on next route change or by the continuous check
        }
      };

      // Listen to productLoaded event to update product data
      onPlentyEvent('frontend:productLoaded', async (eventData: { product: any }) => {
        const product = eventData?.product;
        if (!product || Object.keys(product).length === 0) {
          console.warn('[Uptain] frontend:productLoaded event received but product is empty');
          return;
        }
        
        console.log('[Uptain] frontend:productLoaded event received, updating script data', product);
        await updateProductDataInScript(product);
      });

      // Watch for product changes on product pages (for page refresh scenarios)
      if (route.path.includes('/product/')) {
        const itemId = route.params.itemId as string;
        if (itemId) {
          const { productParams } = createProductParams(route.params);
          const productId = productParams.id.toString();
          if (productId) {
            const { currentProduct } = useProducts();
            const { productForEditor, data: productData } = useProduct(productId);
            
            // Function to get the best available product
            const getBestAvailableProduct = () => {
              return currentProduct.value && Object.keys(currentProduct.value).length > 0
                ? currentProduct.value
                : (productForEditor.value && Object.keys(productForEditor.value).length > 0
                  ? productForEditor.value
                  : (productData.value && Object.keys(productData.value).length > 0
                    ? productData.value
                    : null));
            };
            
            // Watch currentProduct
            watch(
              () => currentProduct.value,
              async (product) => {
                if (product && Object.keys(product).length > 0) {
                  console.log('[Uptain] currentProduct changed, updating script');
                  await updateProductDataInScript(product);
                }
              },
              { deep: true, immediate: false },
            );
            
            // Watch productForEditor
            watch(
              () => productForEditor.value,
              async (product) => {
                if (product && Object.keys(product).length > 0) {
                  console.log('[Uptain] productForEditor changed, updating script');
                  await updateProductDataInScript(product);
                }
              },
              { deep: true, immediate: false },
            );
            
            // Watch productData
            watch(
              () => productData.value,
              async (product) => {
                if (product && Object.keys(product).length > 0) {
                  console.log('[Uptain] productData changed, updating script');
                  await updateProductDataInScript(product);
                }
              },
              { deep: true, immediate: false },
            );
            
            // Continuous check for product data (polling mechanism for page refresh scenarios)
            let checkInterval: ReturnType<typeof setInterval> | null = null;
            let lastProductHash = '';
            
            const checkAndUpdateProduct = async () => {
              const product = getBestAvailableProduct();
              if (product && Object.keys(product).length > 0) {
                // Create a simple hash to detect changes
                const productHash = JSON.stringify({
                  id: productGetters.getId(product),
                  name: productGetters.getName(product),
                });
                
                // Only update if product has changed
                if (productHash !== lastProductHash) {
                  console.log('[Uptain] Continuous check: Product found, updating script');
                  lastProductHash = productHash;
                  await updateProductDataInScript(product);
                  
                  // Stop polling once we have the product
                  if (checkInterval) {
                    clearInterval(checkInterval);
                    checkInterval = null;
                  }
                }
              }
            };
            
            // Start polling immediately and then every 500ms
            checkAndUpdateProduct();
            checkInterval = setInterval(checkAndUpdateProduct, 500);
            
            // Stop polling after 10 seconds (product should be loaded by then)
            setTimeout(() => {
              if (checkInterval) {
                clearInterval(checkInterval);
                checkInterval = null;
                console.log('[Uptain] Stopped continuous product check after 10 seconds');
              }
            }, 10000);
            
            // Clean up on route change
            watch(
              () => route.path,
              () => {
                if (checkInterval) {
                  clearInterval(checkInterval);
                  checkInterval = null;
                }
              },
            );
          }
        }
      }

      // Listen to wishlist changes to update wishlist data
      onPlentyEvent('frontend:addToWishlist', async () => {
        const enabled = isSettingEnabled(getUptainEnabled());
        const uptainId = getValidUptainId();
        if (!enabled || !uptainId) return;
        if (shouldBlockCookies() && !checkCookieConsent()) return;

        console.log('[Uptain] frontend:addToWishlist event received, updating wishlist data');
        const currentScript = document.getElementById('__up_data_qp');
        if (currentScript) {
          // Get product from state (we don't have product in this event, so get it from getAllData)
          const product = getProductFromState();
          const data = await getAllData(product);
          if (data && data.wishlist) {
            currentScript.setAttribute('data-wishlist', data.wishlist);
            console.log('[Uptain] Updated wishlist data:', data.wishlist);
            
            logScriptData(currentScript);
            // Trigger data read
            if (window._upEventBus) {
              window._upEventBus.publish('uptain.readData');
            }
          }
        }
      });

      // Watch for wishlist data changes in state and update script
      const { data: wishlistDataState, wishlistItemIds: wishlistIds } = useWishlist();
      
      // Function to update wishlist in script
      const updateWishlistInScript = async () => {
        const enabled = isSettingEnabled(getUptainEnabled());
        const uptainId = getValidUptainId();
        if (!enabled || !uptainId) return;
        if (shouldBlockCookies() && !checkCookieConsent()) return;

        const currentScript = document.getElementById('__up_data_qp');
        if (currentScript) {
          const product = getProductFromState();
          const data = await getAllData(product);
          if (data && data.wishlist) {
            currentScript.setAttribute('data-wishlist', data.wishlist);
            console.log('[Uptain] Updated wishlist in script:', data.wishlist);
            
            logScriptData(currentScript);
            if (window._upEventBus) {
              window._upEventBus.publish('uptain.readData');
            }
          }
        }
      };
      
      // Watch for wishlist data changes
      watch(
        () => wishlistDataState.value,
        async (wishlistData) => {
          if (wishlistData && wishlistData.length > 0) {
            console.log('[Uptain] Wishlist data changed in state, length:', wishlistData.length);
            await updateWishlistInScript();
          }
        },
        { deep: true, immediate: true },
      );
      
      // Also watch for wishlistItemIds changes (when items are added/removed)
      watch(
        () => wishlistIds.value,
        async (ids) => {
          if (ids && ids.length > 0) {
            console.log('[Uptain] Wishlist IDs changed:', ids);
            // Wait a bit for data to be fetched, then update
            await nextTick();
            setTimeout(async () => {
              await updateWishlistInScript();
            }, 500);
          }
        },
        { deep: true, immediate: true },
      );
    }
  }
  });
});

// Extend Window interface for TypeScript
declare global {
  interface Window {
    _upEventBus?: {
      publish: (event: string) => void;
    };
    __UPTAIN_DEBUG__?: boolean;
  }
}
