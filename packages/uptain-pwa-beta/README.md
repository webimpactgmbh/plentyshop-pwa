# uptain-pwa-beta

Uptain tracking and personalization module for **PlentyONE / Plentyshop PWA** (Nuxt 3).

Install the package, register the module, set environment variables — no patches to Plentyshop core files (`settings.config.ts`, `settings-groups-imports`, etc.) are required.

## Requirements

- Plentyshop PWA / PlentyONE project (Nuxt 3)
- `@plentymarkets/shop-api` and `@plentymarkets/shop-core` (peer dependencies)
- A working shop `.env` with PlentyONE API credentials (`API_ENDPOINT`, `API_SECURITY_TOKEN`, `CONFIG_ID`, …) — see the [Plentyshop quickstart](https://github.com/plentymarkets/plentyshop-pwa)

> Use the package name **`uptain-pwa-beta`** on npm. Do not mix with `@uptain-gmbh/uptain-pwa` unless you standardize on one package intentionally.

## Installation

### Standard (inside `apps/web`)

```bash
cd apps/web
npm install uptain-pwa-beta@1.0.0-beta.27
```

### Turborepo / monorepo (from repository root)

```bash
npm install uptain-pwa-beta@1.0.0-beta.27 --workspace=web
# or
cd apps/web && npm install uptain-pwa-beta@1.0.0-beta.27
```

## Setup (manual steps after install)

### 1. Register the Nuxt module

In **`apps/web/nuxt.config.ts`**:

```ts
export default defineNuxtConfig({
  modules: [
    '@plentymarkets/shop-core',
    '@plentymarkets/shop-module-mollie',
    '@plentymarkets/shop-module-gtag',
    'uptain-pwa-beta',
    // ...other modules
  ],
});
```

### 2. Environment variables

Add to **`apps/web/.env`** (see [`.env.example`](./.env.example) in this package):

```bash
NUXT_PUBLIC_UPTAIN_ID=YOUR_TRACKING_ID
NUXT_PUBLIC_UPTAIN_ENABLED=1
NUXT_PUBLIC_UPTAIN_DEBUG_MODE=0
NUXT_PUBLIC_UPTAIN_COOKIE_GROUP=CookieBar.marketing.label
NUXT_PUBLIC_UPTAIN_BLOCK_COOKIES_INITIALLY=false
NUXT_PUBLIC_UPTAIN_TRANSMIT_NEWSLETTER_DATA=false
NUXT_PUBLIC_UPTAIN_TRANSMIT_CUSTOMER_DATA=false
NUXT_PUBLIC_UPTAIN_TRANSMIT_REVENUE=false
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NUXT_PUBLIC_UPTAIN_ID` | **Yes** (when enabled) | Your Uptain tracking ID from the Uptain dashboard |
| `NUXT_PUBLIC_UPTAIN_ENABLED` | Recommended | `1` = load tracking script, `0` = off |
| `NUXT_PUBLIC_UPTAIN_DEBUG_MODE` | No | `1` = log `data-*` attributes to the browser console |
| `NUXT_PUBLIC_UPTAIN_COOKIE_GROUP` | No | Cookie bar group for consent (default: marketing) |
| `NUXT_PUBLIC_*_TRANSMIT_*` | No | Personal data / revenue transmission toggles |

The module merges these into `runtimeConfig.public` automatically. You do **not** need to edit `apps/web/app/configuration/settings.config.ts`.

### 3. Ignore generated files

The module creates a symlink at build time:

```text
apps/web/modules/uptain/runtime → node_modules/uptain-pwa-beta/runtime
```

Add to your shop **`.gitignore`**:

```gitignore
# Uptain PWA module (generated on nuxt prepare / dev / build)
apps/web/modules/uptain
```

### 4. Restart the dev server

After install or `.env` changes:

```bash
npm run dev
```

The editor settings symlink is created when Nuxt starts (`nuxt prepare` / `npm run dev`).

### 5. Editor settings (merchant UI)

Merchants configure Uptain under:

**SEO settings → Tracking & analytics → Uptain**

#### Local development (editor UI)

In **`apps/web/.env`**:

```bash
NUXT_PUBLIC_IS_PREVIEW=1
```

Restart the dev server and open the shop in the browser.

Optional: if preview mode is driven by a PlentyONE cookie in your environment, set a `pwa` cookie and reload. This is **not** required on all setups.

#### Production / PlentyONE preview

1. Deploy the shop from your Git connection in PlentyONE.
2. Activate **preview mode** for the shop.
3. Open the editor from PlentyONE (**Shop » Management**).

Changes to some editor settings may require a **shop redeploy** to take effect (shown in the Uptain settings panel).

## What you do **not** need to change

On stock Plentyshop PWA (from **1.0.0-beta.25** onward):

- `apps/web/app/utils/settings-groups-imports` — no extra globs
- `apps/web/app/utils/settings-translations-imports` — no extra globs
- `apps/web/app/configuration/settings.config.ts` — no Uptain keys required

The module registers editor UI via `apps/web/modules/uptain/runtime`, which Plentyshop discovers with its built-in `~~/modules/*/runtime/components/settings/**` glob.

## How it works (technical)

1. **Tracking:** client/server plugins load the Uptain script and register cookie-bar entries.
2. **Editor UI:** on module setup, `runtime/` is linked into `apps/web/modules/uptain/runtime`.
3. **Settings API:** `useSiteSettings('uptainId')` etc. read from `runtimeConfig.public` and persisted shop settings.

## Troubleshooting

| Problem | Check |
|---------|--------|
| No tracking script | `NUXT_PUBLIC_UPTAIN_ENABLED=1` and a valid `NUXT_PUBLIC_UPTAIN_ID` |
| No Uptain block in editor | `NUXT_PUBLIC_IS_PREVIEW=1`, dev server restarted, `apps/web/modules/uptain/runtime` exists |
| Cookie / consent issues | `NUXT_PUBLIC_UPTAIN_COOKIE_GROUP` matches a group in your cookie bar config |
| Debug | `NUXT_PUBLIC_UPTAIN_DEBUG_MODE=1`, look for `#__up_data_qp` in the DOM |

Enable debug logging:

```bash
NUXT_PUBLIC_UPTAIN_DEBUG_MODE=1
```

## License

MIT
