<script lang="ts">
  import { resolve } from '$app/paths'
  import type { Snippet } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
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

  const nextMode = $derived<ColorMode>($colorMode === 'dark' ? 'light' : 'dark')
</script>

<svelte:window onkeydown={handleKeydown} />

{#snippet settings(idSuffix: string)}
  <label class="sr-only" for={`app-language-${idSuffix}`}
    >{$translations.layout.language.label}</label
  >
  <select
    id={`app-language-${idSuffix}`}
    class="rounded-sm border border-ui-line-strong bg-ui-raised px-2 py-1.5 text-sm text-ui-text focus:border-ui-accent focus:outline-none"
    value={$locale}
    onchange={handleLanguageChange}
  >
    {#each $translations.layout.language.options as option (option.code)}
      <option value={option.code}>{option.label}</option>
    {/each}
  </select>
  <button
    type="button"
    class="ui-btn px-3 py-1.5"
    aria-label={$translations.layout.colorMode.switchTo[nextMode]}
    title={$translations.layout.colorMode.switchTo[nextMode]}
    onclick={() => setColorMode(nextMode)}
  >
    {$translations.layout.colorMode.options[nextMode]}
  </button>
{/snippet}

<div class="flex min-h-dvh flex-col">
  <header class="border-b border-ui-line bg-ui-panel">
    <div
      class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6"
    >
      <div class="flex min-w-0 items-center gap-3">
        {#if currentUser}
          <button
            bind:this={navToggle}
            type="button"
            class="ui-btn h-9 w-9 p-0 md:hidden"
            aria-label={$translations.layout.navToggleLabel}
            aria-expanded={navOpen}
            aria-controls="app-navigation"
            onclick={toggleNav}
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        {/if}
        <a
          href={resolve(currentUser ? '/board' : '/login')}
          class="flex min-w-0 items-baseline gap-3"
        >
          <span
            class="font-mono text-xs font-semibold tracking-wider whitespace-nowrap text-ui-accent uppercase"
            >{$translations.layout.headerSubtitle}</span
          >
          <span class="hidden truncate font-semibold sm:inline"
            >{$translations.layout.headerTitle}</span
          >
        </a>
        {#if currentUser}
          <nav
            class="ml-4 hidden md:block"
            aria-label={$translations.layout.navLabel}
          >
            <NavList currentPath={page.url.pathname} orientation="horizontal" />
          </nav>
        {/if}
      </div>

      <div class="flex items-center gap-2">
        <div class="hidden items-center gap-2 sm:flex">
          {@render settings('header')}
        </div>
        {#if currentUser}
          <span class="ml-2 hidden font-mono text-sm text-ui-muted md:inline"
            >{currentUser.username}</span
          >
          <button
            type="button"
            class="ui-btn hidden px-3 py-1.5 md:inline-flex"
            onclick={handleLogout}
            disabled={isLoggingOut}
          >
            {$translations.layout.logoutLabel}
          </button>
        {/if}
      </div>
    </div>
  </header>

  {#if currentUser}
    {#if navOpen}
      <button
        type="button"
        class="fixed inset-0 z-20 cursor-default bg-black/50 md:hidden"
        aria-label={$translations.layout.navCloseLabel}
        tabindex="-1"
        onclick={closeNav}
      ></button>
    {/if}
    <aside
      id="app-navigation"
      class={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-ui-line bg-ui-panel px-5 py-6 transition-transform duration-200 md:hidden ${
        navOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label={$translations.layout.navLabel}
      inert={!navOpen}
    >
      <p class="ui-label">{$translations.layout.navLabel}</p>
      <NavList
        currentPath={page.url.pathname}
        orientation="vertical"
        onChoose={closeNav}
      />
      <div class="mt-8 flex items-center gap-2 border-t border-ui-line pt-6">
        {@render settings('drawer')}
      </div>
      <div class="mt-auto border-t border-ui-line pt-4">
        <p class="mb-3 font-mono text-sm text-ui-muted">
          {currentUser.username}
        </p>
        <button
          type="button"
          class="ui-btn w-full"
          onclick={handleLogout}
          disabled={isLoggingOut}
        >
          {$translations.layout.logoutLabel}
        </button>
      </div>
    </aside>
  {/if}

  <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
    {@render children()}
  </main>
</div>
