/**
 * Server-side plugin to register Uptain cookies in the cookie consent manager
 * This plugin runs before the cookie bar is initialized and adds Uptain cookies
 * to the configured cookie group dynamically. Opt-in only (no opt-out mode).
 */
import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app';

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig();

  const configuredCookieGroup =
    (runtimeConfig.public.uptainCookieGroup as string | undefined) || 'CookieBar.marketing.label';

  if (!configuredCookieGroup) return;

  type CookieItem = { name?: string };
  type CookieGroup = { name: string; cookies?: CookieItem[] };
  const cookieGroups = runtimeConfig.public.cookieGroups as unknown as { groups?: CookieGroup[] } | undefined;
  if (!cookieGroups?.groups) return;

  const targetGroup = cookieGroups.groups.find((group) => group.name === configuredCookieGroup);
  if (!targetGroup) return;

  if (!targetGroup.cookies) targetGroup.cookies = [];
  const newCookie: CookieItem & Record<string, unknown> = {
    name: 'CookieBar.uptain.cookies.uptain.name',
    Provider: 'CookieBar.uptain.cookies.uptain.provider',
    Status: 'CookieBar.uptain.cookies.uptain.status',
    PrivacyPolicy: '/PrivacyPolicy',
    Lifespan: 'CookieBar.uptain.cookies.uptain.lifespan',
    accepted: false,
  };

  if (!targetGroup.cookies.some((cookie) => cookie.name === newCookie.name)) {
    targetGroup.cookies.push(newCookie);
  }
});

