<script lang="ts">
  import '$lib/styles/app.css'
  import { untrack } from 'svelte'
  import { page } from '$app/state'
  import AppShell from '$lib/components/AppShell.svelte'
  import { createI18n, setI18nContext } from '$lib/i18n'
  import type { LayoutProps } from './$types'

  let { data, children }: LayoutProps = $props()

  // Per-request (SSR) / per-app (browser) i18n state shared via context.
  const i18n = createI18n(untrack(() => data.locale))
  setI18nContext(i18n)
  const { locale } = i18n

  // Keep in sync when the layout load re-runs (e.g. after login/logout).
  $effect(() => {
    locale.set(data.locale)
  })

  $effect(() => {
    document.documentElement.lang = $locale
  })
</script>

<!-- The big-screen board is a full-viewport terminal without the app chrome. -->
{#if page.route.id === '/board/[barId]'}
  {@render children()}
{:else}
  <AppShell currentUser={data.currentUser}>
    {@render children()}
  </AppShell>
{/if}
