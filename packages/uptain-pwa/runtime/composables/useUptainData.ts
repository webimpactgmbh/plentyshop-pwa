import { computed, unref, type Ref } from 'vue';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import type { UptainContext } from '../types/uptain-context';
import type { Cart, CartItem, Product, User, Order } from '@plentymarkets/shop-api';
import { cartGetters, productGetters, productPropertyGetters, orderGetters, categoryGetters, categoryTreeGetters, tagGetters, shippingProviderGetters, paymentProviderGetters, userAddressGetters, AddressType } from '@plentymarkets/shop-api';

export const useUptainData = (context: UptainContext) => {
  const TARGET_CURRENCY = 'EUR';
  const routeRef = context.getRoute();
  const route = computed(() => unref(routeRef) as RouteLocationNormalizedLoaded);
  const runtimeConfig = context.getRuntimeConfig();
  const { user, isAuthorized } = context.useCustomer();
  const { wishlistItemIds, data: wishlistData, loading: wishlistLoading, fetchWishlist } = context.useWishlist();
  const getSetting = context.getSiteSetting('uptainId');
  const getBlockCookies = context.getSiteSetting('uptainBlockCookiesInitially');
  const getNewsletterData = context.getSiteSetting('uptainTransmitNewsletterData');
  const getCustomerData = context.getSiteSetting('uptainTransmitCustomerData');
  const getRevenue = context.getSiteSetting('uptainTransmitRevenue');
  const getDebugMode = context.getSiteSetting('uptainDebugMode');

  const isDebugEnabled = () => {
    const value = getDebugMode();
    return value === true || value === 1 || value === '1' || value === 'true';
  };

  const debugLog = (...args: unknown[]) => {
    if (isDebugEnabled()) console.log(...args);
  };

  const revenueCache = context.getState<string | null>('uptain-revenue-cache', () => null);

  const getPluginVersion = () => {
    return 'plentyshop-pwa_1.0.7';
  };

  const getReturnUrl = () => {
    return `${runtimeConfig.public.domain || ''}${context.getLocalePath('/cart')}`;
  };

  const getPageType = (): string => {
    const r = route.value;
    const path = r.path;
    if (path === '/' || path === '') return 'home';
    if (path.includes('/product/') || r.meta?.type === 'product') return 'product';
    if (path.includes('/cart')) return 'cart';
    if (path.includes('/checkout')) return 'checkout';
    if (path.includes('/confirmation/')) return 'success';
    if (path.includes('/search')) return 'search';
    if (path.includes('/tag/')) return 'category';
    if (r.meta?.type === 'category') return 'category';
    const { data: productsCatalog } = context.useProducts();
    if (productsCatalog.value && (productsCatalog.value as { category?: unknown }).category && r.meta?.type !== 'product') {
      return 'category';
    }
    return 'other';
  };

  const formatPrice = (price: number | null | undefined): string => {
    if (!price) return '0.00';
    return price.toFixed(2);
  };

  const UPTAIN_SUCCESS_SCV_KEY = 'uptain-success-scv';

  /** Net merchandise value of an order (excl. tax/shipping/payment), same basis as cart scv. */
  const getMerchandiseNetFromOrder = (order: Order | null | undefined): number => {
    if (!order) return 0;

    const totals = orderGetters.getTotals(order) || order.totals;
    const fromTotals = Number(totals?.itemSumNet ?? 0);
    if (fromTotals > 0) return fromTotals;

    const amounts = order.order?.amounts;
    if (Array.isArray(amounts) && amounts.length > 0) {
      const amount = amounts.find((entry) => !entry.isSystemCurrency) || amounts[0];
      if (amount) {
        const netTotal = Number(amount.netTotal || 0);
        const shippingNet = Number(amount.shippingCostsNet || 0);
        const merchandise = netTotal - shippingNet;
        if (merchandise > 0) return merchandise;
      }
    }

    return 0;
  };

  const persistSuccessOrderScv = (order: Order | null | undefined) => {
    if (!import.meta.client || !order) return;
    const net = getMerchandiseNetFromOrder(order);
    if (net <= 0) return;
    try {
      sessionStorage.setItem(UPTAIN_SUCCESS_SCV_KEY, formatPrice(net));
      debugLog('[Uptain] persistSuccessOrderScv', formatPrice(net));
    } catch {
      // ignore storage errors
    }
  };

  const readPersistedSuccessScv = (): string | null => {
    if (!import.meta.client) return null;
    try {
      return sessionStorage.getItem(UPTAIN_SUCCESS_SCV_KEY);
    } catch {
      return null;
    }
  };

  const clearPersistedSuccessScv = () => {
    if (!import.meta.client) return;
    try {
      sessionStorage.removeItem(UPTAIN_SUCCESS_SCV_KEY);
    } catch {
      // ignore storage errors
    }
  };

  const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

  const normalizeCurrencyValue = (
    value: number | null | undefined,
    currency: string | null | undefined,
    conversionFactor: number | null | undefined,
  ): number => {
    if (value == null) return 0;
    if (!currency || currency === TARGET_CURRENCY) return value;
    if (!conversionFactor || conversionFactor <= 0) return value;
    return value / conversionFactor;
  };

  const getProductConversionData = (product: Product | null | undefined) => {
    const data = product?.prices?.default?.data;
    return {
      currency: data?.currency ?? null,
      conversionFactor: data?.conversionFactor ?? null,
    };
  };

  const getCartConversionData = (cart: Cart | null | undefined) => {
    if (!cart) {
      return { currency: null, conversionFactor: null };
    }
    const itemWithPrice = cart.items?.find((item) => item?.variation?.prices?.default?.data);
    const data = itemWithPrice?.variation?.prices?.default?.data;
    return {
      currency: data?.currency ?? cart.currency ?? null,
      conversionFactor: data?.conversionFactor ?? null,
    };
  };

  const getWishlistData = async (): Promise<string> => {
    // First, check if we have data in state
    let currentWishlistData = asArray<unknown>(wishlistData.value);
    const wishlistIds = asArray<string | number>(wishlistItemIds.value);
    
    // If no data in state, try to fetch it
    if (currentWishlistData.length === 0) {
      // Only fetch if user is authorized or has wishlist item IDs
      if (isAuthorized.value || wishlistIds.length > 0) {
        if (!wishlistLoading.value) {
          try {
            debugLog('[Uptain] Fetching wishlist, isAuthorized:', isAuthorized.value, 'wishlistItemIds:', wishlistItemIds.value);
            const fetchedData = await fetchWishlist();
            debugLog('[Uptain] Fetched wishlist data:', fetchedData);
            currentWishlistData = asArray<unknown>(fetchedData ?? wishlistData.value);
            debugLog('[Uptain] Using wishlist data:', currentWishlistData);
          } catch (error) {
            console.warn('[Uptain] Failed to fetch wishlist:', error);
          }
        }
      }
    }

    // Process wishlist data
    if (currentWishlistData && Array.isArray(currentWishlistData) && currentWishlistData.length > 0) {
      const wishlistProducts: Record<string, any> = {};

      currentWishlistData.forEach((wishlistItem: any) => {
        debugLog('[Uptain] Processing wishlistItem:', wishlistItem);
        
        // WishlistItem has structure: { item: {...}, texts: {...}, variation: {...}, images: {...} }
        // The item property contains the product data, variation contains variation-specific data
        const item = wishlistItem.item;
        const variation = wishlistItem.variation;
        const texts = wishlistItem.texts;
        
        if (!item && !variation) {
          console.warn('[Uptain] WishlistItem missing both item and variation:', wishlistItem);
          return;
        }

        // Use item if available (it's the full product), otherwise use variation
        const product = item || variation;
        
        // Get product ID - try from item first, then variation
        const productId = (item?.id?.toString()) || 
                         (variation?.itemId?.toString()) || 
                         productGetters.getId(product)?.toString() || 
                         '';
        debugLog('[Uptain] Product ID:', productId, 'from item:', item?.id, 'from variation:', variation?.itemId);
        
        if (!productId) {
          console.warn('[Uptain] Could not get product ID. Item:', item, 'Variation:', variation);
          return;
        }

        // Get product name - try multiple sources
        // texts.name1 is the product name in WishlistItem
        // item.texts.name1 would be in the item if it has texts
        // productGetters.getName() should work on the product object
        let productName = texts?.name1 || 
                         item?.texts?.name1 || 
                         productGetters.getName(product) || 
                         productGetters.getName(item) || 
                         productGetters.getName(variation) || 
                         '';
        debugLog('[Uptain] Product name:', productName,
                   'from texts.name1:', texts?.name1,
                   'from item.texts.name1:', item?.texts?.name1,
                   'from productGetters:', productGetters.getName(product));
        
        // Get variants from variationProperties as object, e.g. { size: '45' }
        const variationProperties = variation?.variationProperties || item?.variationProperties || [];
        const variantsObj: Record<string, string> = {};
        variationProperties
          .flatMap((group: any) => group.properties || [])
          .forEach((prop: any) => {
            const name = prop.names?.name || prop.name || '';
            const value = prop.values?.value || prop.value || '';
            if (name && value) variantsObj[name] = String(value);
          });
        const hasVariants = Object.keys(variantsObj).length > 0;
        debugLog('[Uptain] Variants:', hasVariants ? variantsObj : '(none)', 'from properties:', variationProperties.length);

        wishlistProducts[productId] = {
          amount: 1,
          name: productName,
          ...(hasVariants && { variants: variantsObj }),
        };
        
        debugLog('[Uptain] Added product to wishlist:', productId, wishlistProducts[productId]);
      });

      // Serialize with keys unquoted, string values in single quotes; omit variants when empty
      const escapeForSingleQuoted = (s: string) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const serializeVariants = (v: Record<string, string>) => {
        const parts = Object.entries(v).map(([k, val]) => `${k}:'${escapeForSingleQuoted(val)}'`);
        return `{${parts.join(',')}}`;
      };
      const entries = Object.entries(wishlistProducts).map(([id, obj]) => {
        const parts = [`amount:${obj.amount}`, `name:'${escapeForSingleQuoted(obj.name)}'`];
        if (obj.variants && typeof obj.variants === 'object' && Object.keys(obj.variants).length > 0) {
          parts.push(`variants:${serializeVariants(obj.variants as Record<string, string>)}`);
        }
        return `${id}:{${parts.join(',')}}`;
      });
      const result = `{${entries.join(',')}}`;
      debugLog('[Uptain] Wishlist result:', result, 'Products count:', Object.keys(wishlistProducts).length);
      return result;
    }

    debugLog('[Uptain] No wishlist data available, returning empty');
    return '{}';
  };

  const getComparisonData = (): string => {
    // TODO: Implement comparison data collection
    return '{}';
  };

  const getCartData = (cartOverride?: Cart | null) => {
    const cart = (cartOverride ?? context.useCart().data.value) as Cart | null | undefined;
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      // Always send scv so Uptain does not keep a stale cart value after the cart is emptied.
      return { scv: '0' };
    }
    const cartValue = cart as Cart;
    const cartItems = cartValue.items ?? [];

    const totals = cartGetters.getTotals(cartValue);
    const { currency: cartCurrency, conversionFactor } = getCartConversionData(cartValue);
    // Uptain handbook scv: "Current net sum of the shopping cart. Excluding taxes,
    // delivery or payment costs." Prefer itemSumNet; if the API returns the same
    // value as basketAmountNet, strip shipping/payment so scv stays merchandise-only.
    const itemSumNetRaw = Number(cartValue.itemSumNet ?? cartGetters.getItemSumNet(cartValue) ?? 0);
    const basketAmountNetRaw = Number(cartValue.basketAmountNet ?? cartGetters.getBasketAmountNet(cartValue) ?? 0);
    const shippingAmountNetRaw = Number(
      cartValue.shippingAmountNet ?? cartGetters.getShippingAmountNet(cartValue) ?? 0,
    );
    const paymentAmountRaw = Number(cartValue.paymentAmount ?? 0);
    const merchandiseNetRaw =
      itemSumNetRaw > 0 && (shippingAmountNetRaw <= 0 || itemSumNetRaw + 0.001 < basketAmountNetRaw)
        ? itemSumNetRaw
        : Math.max(0, basketAmountNetRaw - shippingAmountNetRaw - paymentAmountRaw);
    const netTotal = normalizeCurrencyValue(merchandiseNetRaw, cartCurrency, conversionFactor);
    debugLog('[Uptain] getCartData scv sources', {
      itemSumNetRaw,
      basketAmountNetRaw,
      shippingAmountNetRaw,
      paymentAmountRaw,
      merchandiseNetRaw,
      scv: formatPrice(netTotal),
    });
    const currency = TARGET_CURRENCY;
    
    // Calculate total tax amount from all VATs
    const totalVats = totals.totalVats;
    const taxAmountRaw = Array.isArray(totalVats)
      ? totalVats.reduce((sum: number, vat: any) => {
          return sum + (cartGetters.getTotalVatAmount(vat) || 0);
        }, 0)
      : 0;
    const taxAmount = normalizeCurrencyValue(taxAmountRaw, cartCurrency, conversionFactor);
    
    const shippingCostsRaw = cartGetters.getShippingAmountNet(cartValue) || 0;
    const shippingCosts = normalizeCurrencyValue(shippingCostsRaw, cartCurrency, conversionFactor);

    // Get payment costs from order properties (additional costs)
    const orderPropertiesWithVat = cartGetters.getOrderPropertiesAdditionalCostsWithVat(cartValue) || [];
    const orderPropertiesWithoutVat = cartGetters.getOrderPropertiesWithoutVat(cartValue) || [];
    
    // Calculate payment costs from order properties
    // Note: This might not be 100% accurate as order properties can include other costs too
    let paymentCostsRaw = 0;
    [...orderPropertiesWithVat, ...orderPropertiesWithoutVat].forEach((property: any) => {
      // Check if this property is related to payment (this is a best guess)
      // In practice, payment costs might be stored differently
      if (property?.price) {
        paymentCostsRaw += property.price;
      }
    });
    const paymentCosts = normalizeCurrencyValue(paymentCostsRaw, cartCurrency, conversionFactor);

    const products: Record<string, { amount: number; name: string; variants?: Record<string, string> }> = {};
    cartItems.forEach((item: CartItem) => {
      const variation = cartGetters.getVariation(item);
      if (!variation) return;

      const productId = productGetters.getId(variation)?.toString() || '';
      if (productId) {
        const variationName = productGetters.getName(variation) || '';
        const variationProperties = variation.variationProperties || [];
        const variantsObj: Record<string, string> = {};
        variationProperties.forEach((group: any) => {
          (group.properties || []).forEach((prop: any) => {
            const name = prop.names?.name || prop.name || '';
            const value = prop.values?.value || prop.value || '';
            if (name && value) variantsObj[name] = String(value);
          });
        });
        const hasVariants = Object.keys(variantsObj).length > 0;
        products[productId] = {
          amount: item.quantity,
          name: variationName,
          ...(hasVariants && { variants: variantsObj }),
        };
      }
    });

    // Get postal codes from addresses
    const shippingAddressId = cartGetters.getCustomerShippingAddressId(cartValue);
    const billingAddressId = cartGetters.getCustomerInvoiceAddressId(cartValue);
    const postalCodeParts: string[] = [];
    
    // Get addresses from address store
    const { addresses: shippingAddresses, get: getShipping } = context.useAddressStore(AddressType.Shipping);
    const { addresses: billingAddresses, get: getBilling } = context.useAddressStore(AddressType.Billing);
    const shippingAddressList = asArray<unknown>(shippingAddresses.value);
    const billingAddressList = asArray<unknown>(billingAddresses.value);
    
    if (shippingAddressId) {
      const shippingAddress = getShipping(shippingAddressId) || 
        shippingAddressList.find((addr: any) => addr.id === shippingAddressId);
      if (shippingAddress) {
        const postalCode = userAddressGetters.getPostCode(shippingAddress as any);
        if (postalCode) {
          postalCodeParts.push(postalCode);
        }
      }
    }
    
    if (billingAddressId && billingAddressId !== shippingAddressId) {
      const billingAddress = getBilling(billingAddressId) || 
        billingAddressList.find((addr: any) => addr.id === billingAddressId);
      if (billingAddress) {
        const postalCode = userAddressGetters.getPostCode(billingAddress as any);
        if (postalCode && !postalCodeParts.includes(postalCode)) {
          postalCodeParts.push(postalCode);
        }
      }
    }

    // Get shipping method name
    let shippingName = '';
    const { data: shippingMethodData, selectedMethod } = context.useCartShippingMethods();
    const selectedMethodValue = selectedMethod.value as unknown;
    const shippingMethodList = asArray<unknown>(
      (shippingMethodData.value as { list?: unknown[] } | null | undefined)?.list,
    );
    if (selectedMethodValue) {
      shippingName = shippingProviderGetters.getShippingMethodName(selectedMethodValue as any) || '';
    } else if (shippingMethodList.length) {
      // Try to find the selected shipping method by profile ID
      const shippingProfileId = shippingProviderGetters.getShippingProfileId(cartValue);
      const selectedShippingMethod = shippingMethodList.find(
        (method: any) => shippingProviderGetters.getParcelServicePresetId(method) === shippingProfileId
      );
      if (selectedShippingMethod) {
        shippingName = shippingProviderGetters.getShippingMethodName(selectedShippingMethod as any) || '';
      }
    }

    // Get payment method name
    let paymentName = '';
    const { data: paymentMethodData } = context.usePaymentMethods();
    const paymentMethodList = asArray<unknown>(
      (paymentMethodData.value as { list?: unknown[] } | null | undefined)?.list,
    );
    if (cartValue.methodOfPaymentId && paymentMethodList.length) {
      const paymentMethod = paymentProviderGetters.getPaymentMethodById(
        paymentMethodList as any,
        cartValue.methodOfPaymentId
      );
      if (paymentMethod) {
        paymentName = paymentProviderGetters.getName(paymentMethod) || '';
      }
    }

    // Same format as wishlist: keys unquoted, single quotes for values, variants as object and omitted when empty
    const escapeForSingleQuoted = (s: string) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const serializeVariants = (v: Record<string, string>) => {
      const parts = Object.entries(v).map(([k, val]) => `${k}:'${escapeForSingleQuoted(val)}'`);
      return `{${parts.join(',')}}`;
    };
    const cartProductEntries = Object.entries(products).map(([id, obj]) => {
      const parts = [`amount:${obj.amount}`, `name:'${escapeForSingleQuoted(obj.name)}'`];
      if (obj.variants && Object.keys(obj.variants).length > 0) {
        parts.push(`variants:${serializeVariants(obj.variants)}`);
      }
      return `${id}:{${parts.join(',')}}`;
    });
    const productsStr = Object.keys(products).length > 0 ? `{${cartProductEntries.join(',')}}` : '{}';

    return {
      scv: formatPrice(netTotal),
      currency,
      'tax-amount': formatPrice(taxAmount),
      'shipping-costs': formatPrice(shippingCosts),
      'payment-costs': formatPrice(paymentCosts),
      'postal-code': postalCodeParts.join(';') || '',
      products: productsStr,
      shipping: shippingName,
      payment: paymentName,
      'usedvoucher': cartGetters.getCouponCode(cartValue) || '',
      'voucher-amount': formatPrice(
        normalizeCurrencyValue(
          cartGetters.getCouponDiscount(cartValue) || 0,
          cartCurrency,
          conversionFactor,
        ),
      ),
      'voucher-type': cartGetters.getCouponDiscount(cartValue) ? 'monetary' : '',
    };
  };

  const getProductData = (product: Product | null) => {
    debugLog('[Uptain] getProductData called with product:', product ? 'exists' : 'null');
    if (!product) {
      console.warn('[Uptain] getProductData: product is null or undefined');
      return null;
    }
    
    // Check if product has actual data (not just an empty object)
    if (Object.keys(product).length === 0) {
      console.warn('[Uptain] getProductData: product is an empty object');
      return null;
    }
    
    debugLog('[Uptain] getProductData: product has data, processing...');

    const productId = productGetters.getId(product)?.toString() || '';
    const productName = productGetters.getName(product) || '';
    const { currency: productCurrency, conversionFactor } = getProductConversionData(product);
    const productPrice = normalizeCurrencyValue(productGetters.getPrice(product) || 0, productCurrency, conversionFactor);
    const originalPrice = normalizeCurrencyValue(
      productGetters.getCrossedPrice(product) || productPrice,
      productCurrency,
      conversionFactor,
    );
    const productImage = productGetters.getCoverImage(product) || '';
    const categoryIds = productGetters.getCategoryIds(product) || [];

    // Get product tags
    const productTags = tagGetters.getTags(product) || [];
    const tags = productTags.map((tag) => tagGetters.getTagName(tag)).filter(Boolean);

    // Get category name and paths from categoryTree
    const { data: categoryTree } = context.useCategoryTree();
    const categoryTreeList = asArray<unknown>(categoryTree.value);
    let productCategory = '';
    const categoryPaths: string[] = [];

    if (categoryTreeList.length > 0 && categoryIds.length > 0) {
      // Get the first category name
      const firstCategoryId = categoryIds[0];
      const firstCategoryIdNumber = typeof firstCategoryId === 'string' ? parseInt(firstCategoryId, 10) : firstCategoryId;
      if (firstCategoryIdNumber !== undefined && !isNaN(firstCategoryIdNumber)) {
        const categoryTreeItem = categoryTreeGetters.findCategoryById(categoryTreeList as any, firstCategoryIdNumber);
        if (categoryTreeItem) {
          productCategory = categoryTreeGetters.getName(categoryTreeItem) || '';
        }
      }

      // Generate breadcrumbs for all categories to get paths
      categoryIds.forEach((categoryId) => {
        const categoryIdNumber = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
        if (categoryIdNumber === undefined || isNaN(categoryIdNumber)) return;
        const breadcrumb = categoryTreeGetters.generateBreadcrumbFromCategory(
          categoryTreeList as any,
          categoryIdNumber,
        );
        // Extract category names from breadcrumb (excluding home)
        const categoryNames = breadcrumb
          .filter((item: { link: string }) => item.link !== '/')
          .map((item: { name: string }) => item.name)
          .filter(Boolean);
        if (categoryNames.length > 0) {
          categoryPaths.push(categoryNames.join(';'));
        }
      });
    }

    // Fallback to category ID if name not found
    if (!productCategory && categoryIds.length > 0) {
      productCategory = categoryIds[0]?.toString() || '';
    }

    const variantsObj: Record<string, string> = {};

    const addVariant = (name: string, value: string) => {
      if (name && value) variantsObj[name] = String(value);
      else if (value) variantsObj[String(value)] = String(value);
    };

    // Debug: Log the product structure to understand where variation properties might be
    debugLog('[Uptain] Product structure for variants:', {
      hasVariationProperties: !!product.variationProperties,
      variationPropertiesLength: product.variationProperties?.length || 0,
      hasVariation: !!product.variation,
      variationKeys: product.variation ? Object.keys(product.variation) : [],
      hasProperties: !!product.properties,
      propertiesLength: product.properties?.length || 0,
      hasAttributes: !!(product as any).attributes,
      attributesLength: (product as any).attributes?.length || 0,
      hasGroupedAttributes: !!(product as any).groupedAttributes,
      groupedAttributesLength: (product as any).groupedAttributes?.length || 0,
      productKeys: Object.keys(product),
    });

    // Extract variants from variationProperties
    if (product.variationProperties && Array.isArray(product.variationProperties)) {
      debugLog('[Uptain] Found product.variationProperties, processing...');
      product.variationProperties.forEach((group: any) => {
        if (group.properties && Array.isArray(group.properties)) {
          group.properties.forEach((prop: any) => {
            const value = prop.values?.value;
            if (!value) return;
            const name = prop.names?.name ?? '';
            addVariant(name, value);
          });
        }
      });
    }

    if (Object.keys(variantsObj).length === 0) {
      const variationPropertyGroups = productGetters.getPropertyGroups(product);
      debugLog('[Uptain] Trying getPropertyGroups, result:', variationPropertyGroups);
      if (variationPropertyGroups && Array.isArray(variationPropertyGroups) && variationPropertyGroups.length > 0) {
        variationPropertyGroups.forEach((group: any) => {
          if (group.properties && Array.isArray(group.properties)) {
            group.properties.forEach((prop: any) => {
              const name = productPropertyGetters.getPropertyName(prop) || '';
              const value = productPropertyGetters.getPropertyValue(prop) || '';
              debugLog('[Uptain] Property from getPropertyGroups:', { name, value });
              addVariant(name, value);
            });
          }
        });
      }
    }

    if (Object.keys(variantsObj).length === 0 && product.properties && Array.isArray(product.properties)) {
      debugLog('[Uptain] Trying product.properties, length:', product.properties.length);
      product.properties.forEach((prop: any) => {
        const name = productPropertyGetters.getPropertyName(prop) || '';
        const value = productPropertyGetters.getPropertyValue(prop) || '';
        if (name && value) {
          debugLog('[Uptain] Property from product.properties:', { name, value });
          addVariant(name, value);
        }
      });
    }

    if (Object.keys(variantsObj).length === 0 && (product as any).attributes && Array.isArray((product as any).attributes)) {
      debugLog('[Uptain] Trying product.attributes, length:', (product as any).attributes.length);
      (product as any).attributes.forEach((attr: any, index: number) => {
        const name = attr.attribute?.backendName ||
                    attr.attribute?.name ||
                    attr.attribute?.names?.name ||
                    attr.name ||
                    '';
        const value = attr.value?.backendName ||
                     attr.value?.value ||
                     attr.values?.value ||
                     attr.value ||
                     '';
        debugLog(`[Uptain] Attribute ${index} extracted:`, { name, value, attrStructure: { hasAttribute: !!attr.attribute, hasValue: !!attr.value } });
        if (name && value) {
          debugLog('[Uptain] Attribute from product.attributes:', { name, value });
          addVariant(name, value);
        }
      });
    }

    if (Object.keys(variantsObj).length === 0 && (product as any).groupedAttributes && Array.isArray((product as any).groupedAttributes)) {
      debugLog('[Uptain] Trying product.groupedAttributes, length:', (product as any).groupedAttributes.length);
      (product as any).groupedAttributes.forEach((group: any) => {
        if (group.attributes && Array.isArray(group.attributes)) {
          group.attributes.forEach((attr: any) => {
            const name = attr.name || attr.names?.name || '';
            const value = attr.value || attr.values?.value || '';
            if (name && value) {
              debugLog('[Uptain] Attribute from product.groupedAttributes:', { name, value });
              addVariant(name, value);
            }
          });
        }
      });
    }

    const hasVariants = Object.keys(variantsObj).length > 0;
    debugLog('[Uptain] Product variants result:', hasVariants ? variantsObj : '(none)',
               'from product.variationProperties:', product.variationProperties?.length || 0,
               'from getPropertyGroups:', productGetters.getPropertyGroups(product)?.length || 0);

    if (!hasVariants) {
      console.warn('[Uptain] No variants found! Full product structure:', JSON.stringify({
        variationProperties: product.variationProperties,
        properties: product.properties,
        variation: product.variation,
      }, null, 2));
    }

    // Same formatting as wishlist: keys unquoted, string values in single quotes; variants as object, omitted when empty
    const escapeForSingleQuoted = (s: string) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const serializeVariants = (v: Record<string, string>) => {
      const parts = Object.entries(v).map(([k, val]) => `${k}:'${escapeForSingleQuoted(val)}'`);
      return `{${parts.join(',')}}`;
    };
    const productVariantsStr = hasVariants ? serializeVariants(variantsObj) : '';

    const productParts = [
      `productId:'${escapeForSingleQuoted(productId)}'`,
      `name:'${escapeForSingleQuoted(productName)}'`,
      `price:'${escapeForSingleQuoted(formatPrice(productPrice))}'`,
      `originalPrice:'${escapeForSingleQuoted(formatPrice(originalPrice))}'`,
      `image:'${escapeForSingleQuoted(productImage)}'`,
      `tags:'${escapeForSingleQuoted(tags.join(';'))}'`,
      `category:'${escapeForSingleQuoted(productCategory)}'`,
      `categoryPaths:'${escapeForSingleQuoted(categoryPaths.join(';'))}'`,
    ];
    if (hasVariants) {
      productParts.push(`variants:${serializeVariants(variantsObj)}`);
    }
    const productSerialized = `{${productParts.join(',')}}`;

    return {
      'product-id': productId,
      'product-name': productName,
      'product-price': formatPrice(productPrice),
      'product-original-price': formatPrice(originalPrice),
      'product-image': productImage,
      'product-tags': tags.join(';'),
      'product-variants': productVariantsStr,
      'product-category': productCategory,
      'product-category-paths': categoryPaths.join(';'),
      product: productSerialized,
    };
  };

  const getCategoryData = () => {
    const path = route.value.path;
    const pageType = getPageType();
    
    // Only return category data if we're actually on a category page
    // Exclude: product, cart, checkout, success, search, home, other pages
    if (pageType !== 'category') {
      return null;
    }
    
    // Additional check: make sure we're not on cart, checkout, product, search, or success pages
    if (path.includes('/cart') || path.includes('/checkout') || path.includes('/product/') || 
        path.includes('/search') || path.includes('/confirmation/')) {
      return null;
    }

    // Get products catalog (category data)
    const { data: productsCatalog } = context.useProducts();
    const productsCatalogValue = productsCatalog.value as { products?: Product[]; category?: unknown } | null | undefined;
    if (!productsCatalogValue?.category) {
      return null;
    }

    const category = productsCatalogValue.category as any;
    const categoryName = categoryGetters.getCategoryName(category) || '';
    
    // Get category path from breadcrumb
    const { data: categoryTree } = context.useCategoryTree();
    let categoryPath = '';
    const categoryTreeList = asArray<unknown>(categoryTree.value);
    if (categoryTreeList.length > 0) {
      const categoryId = categoryGetters.getId(category);
      const categoryIdNumber = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
      if (categoryIdNumber !== undefined && !isNaN(categoryIdNumber)) {
        const breadcrumb = categoryTreeGetters.generateBreadcrumbFromCategory(
          categoryTreeList as any,
          categoryIdNumber,
        );
        // Extract category names from breadcrumb (excluding home)
        const categoryNames = breadcrumb
          .filter((item: { link: string }) => item.link !== '/')
          .map((item: { name: string }) => item.name)
          .filter(Boolean);
        categoryPath = categoryNames.join(';');
      }
    }

    // Get products on the category page
    const products = productsCatalogValue.products || [];
    const categoryProducts: Record<string, { name: string; price: string; originalPrice: string; image: string }> = {};
    products.forEach((product: Product) => {
      const productId = productGetters.getId(product)?.toString() || '';
      if (productId) {
        const productName = productGetters.getName(product) || '';
        const { currency: categoryCurrency, conversionFactor } = getProductConversionData(product);
        const productPrice = normalizeCurrencyValue(productGetters.getPrice(product) || 0, categoryCurrency, conversionFactor);
        const originalPrice = normalizeCurrencyValue(
          productGetters.getCrossedPrice(product) || productPrice,
          categoryCurrency,
          conversionFactor,
        );
        const productImage = productGetters.getCoverImage(product) || '';

        categoryProducts[productId] = {
          name: productName,
          price: formatPrice(productPrice),
          originalPrice: formatPrice(originalPrice),
          image: productImage,
        };
      }
    });

    // Same format as wishlist: keys unquoted, string values in single quotes
    const escapeForSingleQuoted = (s: string) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const categoryProductEntries = Object.entries(categoryProducts).map(([id, obj]) => {
      const inner = `name:'${escapeForSingleQuoted(obj.name)}',price:'${escapeForSingleQuoted(obj.price)}',originalPrice:'${escapeForSingleQuoted(obj.originalPrice)}',image:'${escapeForSingleQuoted(obj.image)}'`;
      return `${id}:{${inner}}`;
    });
    const categoryProductsStr = categoryProductEntries.length > 0 ? `{${categoryProductEntries.join(',')}}` : '{}';

    // Get sorting from URL
    const { getFacetsFromURL } = context.useCategoryFilter();
    const facets = getFacetsFromURL();
    const categorySorting = facets.sort || 'default';

    return {
      'category-name': categoryName,
      'category-path': categoryPath,
      'category-products': categoryProductsStr,
      'category-sorting': categorySorting,
    };
  };

  const getSearchData = () => {
    const pageType = getPageType();
    // Only return search data if we're actually on a search page
    if (pageType !== 'search') {
      return null;
    }
    
    const searchTerm = route.value.query.term as string || route.value.query.q as string || '';
    if (!searchTerm) return null;

    // Get search products from useSearch composable
    const { data: productsCatalog } = context.useSearch();
    const searchProducts: Record<string, any> = {};
    const searchCatalog = productsCatalog.value as { products?: Product[] } | null | undefined;
    const searchList = searchCatalog?.products ?? [];
    
    if (searchList.length) {
      searchList.forEach((product: Product) => {
        const productId = productGetters.getId(product)?.toString() || '';
        if (productId) {
          const productName = productGetters.getName(product) || '';
        const { currency: searchCurrency, conversionFactor } = getProductConversionData(product);
        const productPrice = normalizeCurrencyValue(productGetters.getPrice(product) || 0, searchCurrency, conversionFactor);
        const originalPrice = normalizeCurrencyValue(
          productGetters.getCrossedPrice(product) || productPrice,
          searchCurrency,
          conversionFactor,
        );
          const productImage = productGetters.getCoverImage(product) || '';

          searchProducts[productId] = {
            name: productName,
            price: formatPrice(productPrice),
            'original-price': formatPrice(originalPrice),
            image: productImage,
          };
        }
      });
    }

    // Get sorting from URL
    const { getFacetsFromURL } = context.useCategoryFilter();
    const facets = getFacetsFromURL();
    const searchSorting = facets.sort || 'default';

    return {
      'search-term': searchTerm,
      'search-products': JSON.stringify(searchProducts),
      'search-sorting': searchSorting,
    };
  };

  const getSuccessData = (orderOverride?: Order | null) => {
    const pageType = getPageType();
    // Only return success data if we're actually on a success page
    if (pageType !== 'success') {
      return null;
    }
    
    // Check if we're on a confirmation/success page
    // Route structure: /confirmation/[orderId]/[accessKey]
    // The orderId parameter is the correct order number
    const orderId = route.value.params.orderId as string;
    if (!orderId) return null;

    // The route parameter orderId is the correct order number
    // This matches the route structure: /confirmation/[orderId]/[accessKey]
    const successData: Record<string, string> = {
      success: '1',
      ordernumber: orderId,
    };

    // Same basis as cart scv: net merchandise value (itemSumNet), without VAT/shipping.
    // Cart is empty after checkout, so overwrite the cart fallback scv:"0".
    const orderState = context.getState<{ data: Order | null }>('useCustomerOrder-soft-login', () => ({
      data: null,
    }));
    const order = orderOverride || orderState.value?.data || null;
    const netMerchandise = getMerchandiseNetFromOrder(order);
    if (netMerchandise > 0) {
      successData.scv = formatPrice(netMerchandise);
      persistSuccessOrderScv(order);
      debugLog('[Uptain] getSuccessData: scv from order', {
        scv: successData.scv,
        hasOrder: !!order,
        hasTotals: !!order?.totals,
      });
    } else {
      const persisted = readPersistedSuccessScv();
      if (persisted) {
        successData.scv = persisted;
        debugLog('[Uptain] getSuccessData: scv from sessionStorage', persisted);
      } else {
        debugLog('[Uptain] getSuccessData: no order merchandise net yet, keeping cart scv');
      }
    }

    return successData;
  };

  const checkNewsletterSubscription = async (): Promise<boolean> => {
    if (!user.value) return false;
    const u = user.value as Record<string, unknown>;
    // Shop-API User: newsletterAllowanceAt = timestamp when user allowed newsletter (PlentyMarkets)
    const hasNewsletterAllowance = u.newsletterAllowanceAt != null && Number(u.newsletterAllowanceAt) > 0;
    const hasEmailFolder = !!u.emailFolder;
    const isNewsletterSubscriber = !!u.isNewsletterSubscriber;
    return hasNewsletterAllowance || hasEmailFolder || isNewsletterSubscriber;
  };

  const checkHasSuccessfulOrders = async (): Promise<boolean> => {
    if (!isAuthorized.value || !user.value) return false;

    try {
      const { fetchCustomerOrders } = context.useCustomerOrders();
      const ordersData = (await fetchCustomerOrders({ page: 1 })) as
        | { data?: { entries?: Order[]; lastPageNumber?: number } }
        | null
        | undefined;
      const orderEntries = ordersData?.data?.entries ?? [];
      
      if (orderEntries.length === 0) {
        return false;
      }

      // Check if there's at least one successful order (positive itemSumNet)
      return orderEntries.some((order: Order) => {
        const totals = orderGetters.getTotals(order);
        if (totals) {
          const netTotal = totals.itemSumNet || 0;
          return netTotal > 0;
        }
        return false;
      });
    } catch (error) {
      console.error('Error checking orders:', error);
      return false;
    }
  };

  // Helper function to check if a setting value is enabled (supports both 'true'/'1' and 'false'/'0')
  const isSettingEnabled = (value: unknown): boolean => {
    if (value === true || value === 1) return true;
    if (value === false || value === 0 || value == null) return false;
    if (typeof value === 'string') return value === 'true' || value === '1';
    return false;
  };

  const shouldTransmitPersonalData = async (): Promise<boolean> => {
    if (!isAuthorized || !user.value) {
      debugLog('[Uptain] shouldTransmitPersonalData: false - not authorized or no user', { isAuthorized: isAuthorized.value, hasUser: !!user.value });
      return false;
    }

    const transmitNewsletter = isSettingEnabled(getNewsletterData());
    const transmitCustomer = isSettingEnabled(getCustomerData());

    // Check if user is newsletter subscriber
    const isNewsletterSubscriber = await checkNewsletterSubscription();

    // Check if user has at least one successful order
    const hasOrders = await checkHasSuccessfulOrders();

    const shouldTransmit = (transmitNewsletter && isNewsletterSubscriber) || (transmitCustomer && hasOrders);
    debugLog('[Uptain] shouldTransmitPersonalData:',
      'shouldTransmit:', shouldTransmit,
      'transmitNewsletter:', transmitNewsletter,
      'transmitCustomer:', transmitCustomer,
      'isNewsletterSubscriber:', isNewsletterSubscriber,
      'hasOrders:', hasOrders,
      'newsletterSetting:', getNewsletterData(),
      'customerSetting:', getCustomerData()
    );
    return shouldTransmit;
  };

  const calculateRevenue = async (): Promise<string> => {
    if (!isAuthorized.value || !user.value) return '0.00';

    // Return cached value if available
    if (revenueCache.value !== null) {
      return revenueCache.value;
    }

    try {
      const { fetchCustomerOrders } = context.useCustomerOrders();
      let totalRevenue = 0;
      let page = 1;
      let hasMorePages = true;

      // Fetch all orders across all pages
      while (hasMorePages) {
        const ordersData = (await fetchCustomerOrders({ page })) as
          | { data?: { entries?: Order[]; lastPageNumber?: number } }
          | null
          | undefined;
        const orderEntries = ordersData?.data?.entries ?? [];
        
        if (orderEntries.length === 0) {
          hasMorePages = false;
          break;
        }

        // Calculate revenue from current page of orders
        orderEntries.forEach((order: Order) => {
          // Only include successful orders (exclude returns/cancelled)
          const totals = orderGetters.getTotals(order);
          if (totals) {
            // Get net total (itemSumNet excludes taxes, shipping, payment costs)
            const netTotal = totals.itemSumNet || 0;
            
            // Only add if order is not a return/cancellation (positive values)
            if (netTotal > 0) {
              totalRevenue += netTotal;
            }
          }
        });

        // Check if there are more pages
        const lastPageNumber = ordersData?.data?.lastPageNumber || 1;
        if (page >= lastPageNumber) {
          hasMorePages = false;
        } else {
          page++;
        }
      }

      const revenue = formatPrice(totalRevenue);
      revenueCache.value = revenue;
      return revenue;
    } catch (error) {
      console.error('Error calculating revenue:', error);
      return '0.00';
    }
  };

  const getCustomerGroupName = (): string => {
    if (!user.value) return '';
    
    // Try to get customer group name from various possible properties
    // The exact property name might vary based on the API response
    const userAny = user.value as any;
    
    // Check for customer group name directly
    if (userAny.customerGroupName) return userAny.customerGroupName;
    if (userAny.customerGroup?.name) return userAny.customerGroup.name;
    if (userAny.className) return userAny.className;
    if (userAny.class?.name) return userAny.class.name;
    
    // Fallback to ID if name is not available
    if (userAny.customerGroupId) return userAny.customerGroupId.toString();
    if (userAny.classId) return userAny.classId.toString();
    if (userAny.plentyId) return userAny.plentyId.toString();
    
    return '';
  };

  const getPersonalDataFromSuccessOrder = (): { email: string; firstname: string; lastname: string } | null => {
    // Confirmation page stores the order under useCustomerOrder-soft-login
    const orderState = context.getState<{ data: Order | null }>('useCustomerOrder-soft-login', () => ({
      data: null,
    }));
    const order = orderState.value?.data;
    if (!order) return null;

    const email = orderGetters.getOrderEmail(order) || '';
    const billingAddress = orderGetters.getBillingAddress(order);
    const firstname = billingAddress?.name2 || '';
    const lastname = billingAddress?.name3 || '';

    if (!email && !firstname && !lastname) return null;
    return { email, firstname, lastname };
  };

  const getPersonalData = async () => {
    const pageType = getPageType();
    const userValue = user.value as User | null | undefined;

    // Success page: always transmit available personal data (ignore newsletter/customer settings).
    // Prefer order contact data so guest checkouts are covered; fall back to logged-in user.
    if (pageType === 'success') {
      const fromOrder = getPersonalDataFromSuccessOrder();
      const email = fromOrder?.email || userValue?.email || '';
      const firstname = fromOrder?.firstname || userValue?.firstName || '';
      const lastname = fromOrder?.lastname || userValue?.lastName || '';

      if (!email && !firstname && !lastname) {
        debugLog('[Uptain] getPersonalData (success): no personal data available yet');
        return null;
      }

      const personalData = { email, firstname, lastname };
      debugLog('[Uptain] getPersonalData (success): transmitting', personalData);
      return personalData;
    }

    const shouldTransmit = await shouldTransmitPersonalData();
    debugLog('[Uptain] getPersonalData called:', 'shouldTransmit:', shouldTransmit, 'hasUser:', !!userValue);
    
    if (!shouldTransmit || !userValue) {
      debugLog('[Uptain] getPersonalData: returning null', 'shouldTransmit:', shouldTransmit, 'hasUser:', !!userValue);
      return null;
    }

    const transmitRevenue = isSettingEnabled(getRevenue());
    // Calculate revenue asynchronously if needed
    const revenue = transmitRevenue ? await calculateRevenue() : '';

    const userAny = userValue as any;
    
    // Extract gender: 'f' for female, 'm' for male, '' for diverse or unknown
    let gender = '';
    if (userAny.gender === 'female' || userAny.gender === 'f' || userAny.gender === 'F') {
      gender = 'f';
    } else if (userAny.gender === 'male' || userAny.gender === 'm' || userAny.gender === 'M') {
      gender = 'm';
    }
    
    // Extract title (e.g. "Dr.", "Mrs.", "Mr.", etc.)
    const title = userAny.title || userAny.titleCode || '';

    const personalData = {
      email: userValue.email || '',
      firstname: userValue.firstName || '',
      lastname: userValue.lastName || '',
      gender: gender,
      title: title,
      uid: userValue.id?.toString() || '',
      revenue: revenue,
      customergroup: getCustomerGroupName(),
    };
    
    debugLog('[Uptain] getPersonalData: returning data', personalData);
    return personalData;
  };

  const getUptainId = (): string => {
    const fromSettings = getSetting();
    if (typeof fromSettings === 'string') return fromSettings;
    if (fromSettings != null) return String(fromSettings);
    const fromConfig = runtimeConfig.public.uptainId;
    if (typeof fromConfig === 'string') return fromConfig;
    if (fromConfig != null) return String(fromConfig);
    return '';
  };

  const getAllData = async (
    product?: Product | null,
    cartOverride?: Cart | null,
    orderOverride?: Order | null,
  ) => {
    const uptainId = getUptainId();
    if (!uptainId || uptainId === 'XXXXXXXXXXXXXXXX') return null;

    const comparisonData = getComparisonData();
    const data: Record<string, string> = {
      plugin: getPluginVersion(),
      returnurl: getReturnUrl(),
      page: getPageType(),
      wishlist: await getWishlistData(),
      ...(comparisonData && comparisonData !== '{}' && { comparison: comparisonData }),
    };

    // Add cart data if cart has items (use cartOverride when provided, e.g. from frontend:addToCart event)
    const cartData = getCartData(cartOverride);
    if (cartData) {
      Object.assign(data, cartData);
    }

    // Add product data if on product page
    if (product) {
      const productData = getProductData(product);
      if (productData) {
        Object.assign(data, productData);
      }
    }

    // Add category data if on category page
    const categoryData = getCategoryData();
    if (categoryData) {
      Object.assign(data, categoryData);
    }

    // Add search data if on search page
    const searchData = getSearchData();
    if (searchData) {
      Object.assign(data, searchData);
    }

    // Add success data if on success page (after cart so scv overwrites empty-cart "0")
    const successData = getSuccessData(orderOverride);
    if (successData) {
      Object.assign(data, successData);
    }

    // Add personal data if settings allow (now async for revenue calculation)
    const personalData = await getPersonalData();
    if (personalData) {
      Object.assign(data, personalData);
    }

    return data;
  };

  const shouldBlockCookies = (): boolean => {
    return isSettingEnabled(getBlockCookies());
  };

  return {
    getAllData,
    shouldBlockCookies,
    getUptainId,
    calculateRevenue,
    persistSuccessOrderScv,
    clearPersistedSuccessScv,
  };
};
