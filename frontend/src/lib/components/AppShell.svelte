<script lang="ts">
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/stores/auth';
  import { page } from '$app/stores';
  import Badge from '$lib/components/Badge.svelte';
  import NavList from '$lib/components/NavList.svelte';
  import { apiConfig } from '$lib/config';
  import { locale, persistPreferredLocale, translations } from '$lib/i18n';
  import type { Locale } from '$lib/i18n';
  import { colorMode, setColorMode } from '$lib/stores/color-mode';
  import type { ColorMode } from '$lib/stores/color-mode';
  import { logoutUser } from '$lib/stores/auth';

  let navOpen = false;
  const toggleNav = () => {
    navOpen = !navOpen;
  };
  const closeNav = () => {
    navOpen = false;
  };
  let isLoggingOut = false;

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }
    isLoggingOut = true;
    closeNav();
    try {
      await logoutUser(fetch);
      goto('/login');
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      isLoggingOut = false;
    }
  };

  let currentPath = '/';
  $: currentPath = $page.url.pathname;

  const syncLanguageWithBackend = async (nextLocale: Locale) => {
    try {
      const response = await fetch(apiConfig.localeEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: nextLocale }),
        credentials: 'include'
      });

      if (!response.ok) {
        return;
      }

      const payload = await response.json().catch(() => null);
      if (payload?.language && payload.language !== nextLocale) {
        locale.set(payload.language);
      }
    } catch (error) {
      console.error('Language sync failed', error);
    }
  };

  const handleLanguageChange = async (event: Event) => {
    const target = event.currentTarget as HTMLSelectElement;
    const nextLocale = target.value as Locale;
    if (nextLocale === $locale) {
      return;
    }

    locale.set(nextLocale);
    persistPreferredLocale(nextLocale);
    await syncLanguageWithBackend(nextLocale);
  };

  type ThemeChoice = { id: 'night' | 'day'; value: ColorMode };
  const themeChoices: ThemeChoice[] = [
    { id: 'night', value: 'dark' },
    { id: 'day', value: 'light' }
  ];
</script>

<div class="min-h-screen bg-market-surface">
  <header class="border-b border-white/10 bg-gradient-to-b from-market-surface/90 to-market-surface/50 px-6 py-4">
    <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          {#if $currentUser}
            <button
              type="button"
              class="h-10 w-10 rounded-full border border-white/20 text-white/80 transition hover:border-white/40"
              aria-label={$translations.layout.navToggleLabel}
              aria-expanded={navOpen}
              on:click={toggleNav}
            >
              <svg viewBox="0 0 24 24" class="m-auto h-5 w-5">
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          {/if}
          <div>
            <p class="text-xs uppercase tracking-[0.4em] text-white/50">{$translations.layout.headerSubtitle}</p>
            <p class="text-2xl font-semibold text-white">{$translations.layout.headerTitle}</p>
          </div>
        </div>
        {#if $currentUser}
          <Badge variant="success">{$translations.layout.headerBadge}</Badge>
        {/if}
    </div>
  </header>
  <div class="flex min-h-[calc(100vh-96px)]">
    {#if navOpen}
      <div class="fixed inset-0 z-20 bg-black/40" on:click={closeNav} aria-hidden="true"></div>
    {/if}

    {#if $currentUser}
      <aside
      class={`fixed inset-y-0 left-0 z-30 w-64 border-r border-white/20 side-panel px-6 py-8 transition-transform duration-300 ${
        navOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col`}
      aria-label={$translations.layout.navLabel}
      aria-hidden={!navOpen}
    >
      <div class="flex h-full flex-col">
        <NavList navItems={$translations.layout.navItems} currentPath={currentPath} onChoose={closeNav} />
        <div class="mt-10 space-y-6 border-t border-white/10 pt-6">
          <div>
            <p class="text-xs uppercase tracking-[0.4em] text-white/60">
              {$translations.layout.language.label}
            </p>
            <select
              class="mt-2 w-full rounded-2xl border border-white/10 bg-market-surface/30 px-4 py-3 text-sm text-white transition focus:border-market-accent/80 focus:outline-none"
              aria-label={$translations.layout.language.label}
              value={$locale}
              on:change={handleLanguageChange}
            >
              {#each $translations.layout.language.options as option}
                <option value={option.code}>{option.label}</option>
              {/each}
            </select>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.4em] text-white/60">
              {$translations.layout.colorMode.label}
            </p>
            <div class="mt-3 grid grid-cols-2 gap-3">
              {#each themeChoices as choice}
                <button
                  type="button"
                  class={`rounded-2xl border px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] transition focus:outline-none ${
                    $colorMode === choice.value
                      ? 'border-market-primary/70 bg-market-primary/10 text-market-primary'
                      : 'border-white/10 text-white/70 hover:border-white/30'
                  }`}
                  on:click={() => setColorMode(choice.value)}
                >
                  {$translations.layout.colorMode.options[choice.id]}
                </button>
              {/each}
            </div>
          </div>
        </div>
        <div class="mt-auto border-t border-white/10 pt-4">
          <button
            type="button"
            class="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-market-surface/30 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-market-accent/70 disabled:opacity-50"
            on:click={handleLogout}
            disabled={isLoggingOut}
          >
            {$translations.layout.logoutLabel}
          </button>
        </div>
        </div>
      </aside>
    {/if}

    <main class="flex-1 p-8">
      <slot />
    </main>
  </div>
</div>
