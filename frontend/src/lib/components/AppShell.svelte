<script lang="ts">
  import { resolve } from '$app/paths'
  import type { Snippet } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import Badge from '$lib/components/Badge.svelte'
  import NavList from '$lib/components/NavList.svelte'
  import { apiConfig } from '$lib/config'
  import {
    getI18nContext,
    matchSupportedLocale,
    persistPreferredLocale,
    type Locale
  } from '$lib/i18n'
  import { logoutUser } from '$lib/stores/auth'
  import {
    colorMode,
    setColorMode,
    type ColorMode
  } from '$lib/stores/color-mode'
  import type { AuthUser } from '$lib/types'

  let {
    currentUser,
    children
  }: { currentUser: AuthUser | null; children: Snippet } = $props()

  const { locale, translations } = getI18nContext()

  let navOpen = $state(false)
  let isLoggingOut = $state(false)
  let navToggle: HTMLButtonElement | undefined = $state()

  const toggleNav = () => {
    navOpen = !navOpen
  }

  const closeNav = () => {
    navOpen = false
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (navOpen && event.key === 'Escape') {
      closeNav()
      navToggle?.focus()
    }
  }

  const handleLogout = async () => {
    if (isLoggingOut) {
      return
    }
    isLoggingOut = true
    closeNav()
    try {
      await logoutUser(fetch)
      await goto(resolve('/login'), { invalidateAll: true })
    } catch (error) {
      console.error('Logout failed', error)
    } finally {
      isLoggingOut = false
    }
  }

  const applyLocale = (nextLocale: Locale) => {
    locale.set(nextLocale)
    persistPreferredLocale(nextLocale)
  }

  const syncLanguageWithBackend = async (nextLocale: Locale) => {
    try {
      const response = await fetch(apiConfig.localeEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: nextLocale }),
        credentials: 'include'
      })

      if (!response.ok) {
        return
      }

      const payload: { language?: unknown } | null = await response
        .json()
        .catch(() => null)
      // Only accept languages the frontend catalog actually supports.
      const confirmed =
        typeof payload?.language === 'string'
          ? matchSupportedLocale(payload.language)
          : undefined
      if (confirmed && confirmed !== nextLocale) {
        applyLocale(confirmed)
      }
    } catch (error) {
      console.error('Language sync failed', error)
    }
  }

  const handleLanguageChange = async (event: Event) => {
    const target = event.currentTarget as HTMLSelectElement
    const nextLocale = matchSupportedLocale(target.value)
    if (!nextLocale || nextLocale === $locale) {
      return
    }

    applyLocale(nextLocale)
    await syncLanguageWithBackend(nextLocale)
  }

  type ThemeChoice = { id: 'night' | 'day'; value: ColorMode }
  const themeChoices: ThemeChoice[] = [
    { id: 'night', value: 'dark' },
    { id: 'day', value: 'light' }
  ]
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="min-h-screen bg-market-surface">
  <header
    class="border-b border-white/10 bg-linear-to-b from-market-surface/90 to-market-surface/50 px-6 py-4"
  >
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        {#if currentUser}
          <button
            bind:this={navToggle}
            type="button"
            class="h-10 w-10 rounded-full border border-white/20 text-white/80 transition hover:border-white/40"
            aria-label={$translations.layout.navToggleLabel}
            aria-expanded={navOpen}
            aria-controls="app-navigation"
            onclick={toggleNav}
          >
            <svg viewBox="0 0 24 24" class="m-auto h-5 w-5" aria-hidden="true">
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
          <p class="text-xs tracking-[0.4em] text-white/50 uppercase">
            {$translations.layout.headerSubtitle}
          </p>
          <p class="text-2xl font-semibold text-white">
            {$translations.layout.headerTitle}
          </p>
        </div>
      </div>
      {#if currentUser}
        <Badge variant="success">{$translations.layout.headerBadge}</Badge>
      {/if}
    </div>
  </header>
  <div class="flex min-h-[calc(100vh-96px)]">
    {#if navOpen}
      <button
        type="button"
        class="fixed inset-0 z-20 cursor-default bg-black/40"
        aria-label={$translations.layout.navCloseLabel}
        tabindex="-1"
        onclick={closeNav}
      ></button>
    {/if}

    {#if currentUser}
      <aside
        id="app-navigation"
        class={`side-panel fixed inset-y-0 left-0 z-30 w-64 border-r border-white/20 px-6 py-8 transition-transform duration-300 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
        aria-label={$translations.layout.navLabel}
        inert={!navOpen}
      >
        <div class="flex h-full flex-col">
          <NavList currentPath={page.url.pathname} onChoose={closeNav} />
          <div class="mt-10 space-y-6 border-t border-white/10 pt-6">
            <div>
              <label
                for="app-language"
                class="text-xs tracking-[0.4em] text-white/60 uppercase"
              >
                {$translations.layout.language.label}
              </label>
              <select
                id="app-language"
                class="mt-2 w-full rounded-2xl border border-white/10 bg-market-surface/30 px-4 py-3 text-sm text-white transition focus:border-market-accent/80 focus:outline-hidden"
                value={$locale}
                onchange={handleLanguageChange}
              >
                {#each $translations.layout.language.options as option (option.code)}
                  <option value={option.code}>{option.label}</option>
                {/each}
              </select>
            </div>
            <div role="group" aria-labelledby="app-color-mode-label">
              <p
                id="app-color-mode-label"
                class="text-xs tracking-[0.4em] text-white/60 uppercase"
              >
                {$translations.layout.colorMode.label}
              </p>
              <div class="mt-3 grid grid-cols-2 gap-3">
                {#each themeChoices as choice (choice.id)}
                  <button
                    type="button"
                    class={`rounded-2xl border px-4 py-3 text-xs font-semibold tracking-[0.3em] uppercase transition focus:outline-hidden ${
                      $colorMode === choice.value
                        ? 'border-market-primary/70 bg-market-primary/10 text-market-primary'
                        : 'border-white/10 text-white/70 hover:border-white/30'
                    }`}
                    aria-label={$translations.layout.colorMode.labels[
                      choice.id
                    ]}
                    aria-pressed={$colorMode === choice.value}
                    onclick={() => setColorMode(choice.value)}
                  >
                    <span aria-hidden="true"
                      >{$translations.layout.colorMode.options[choice.id]}</span
                    >
                  </button>
                {/each}
              </div>
            </div>
          </div>
          <div class="mt-auto border-t border-white/10 pt-4">
            <button
              type="button"
              class="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-market-surface/30 px-4 py-3 text-xs font-semibold tracking-[0.3em] text-white uppercase transition hover:border-market-accent/70 disabled:opacity-50"
              onclick={handleLogout}
              disabled={isLoggingOut}
            >
              {$translations.layout.logoutLabel}
            </button>
          </div>
        </div>
      </aside>
    {/if}

    <main class="flex-1 p-8">
      {@render children()}
    </main>
  </div>
</div>
