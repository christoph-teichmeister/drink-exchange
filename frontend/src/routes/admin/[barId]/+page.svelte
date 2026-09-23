<script lang="ts">
  import { resolve } from '$app/paths'
  import { backendAdminUrl } from '$lib/config'
  import { getI18nContext } from '$lib/i18n'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()

  const { translations } = getI18nContext()
  const t = $derived($translations.admin)

  const sections = [
    { key: 'bar', path: 'bars/bar/' },
    { key: 'drinks', path: 'market/drink/' },
    { key: 'events', path: 'events/eventdefinition/' },
    { key: 'trades', path: 'market/trade/' }
  ] as const
</script>

<svelte:head>
  <title>{t.pageTitle} · {data.bar.name}</title>
</svelte:head>

<div class="max-w-4xl space-y-6">
  <header
    class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
  >
    <div>
      <p class="ui-label">{t.pageTitle}</p>
      <h1 class="mt-1 text-2xl font-semibold tracking-tight">
        {data.bar.name}
      </h1>
      <p class="mt-1 text-ui-muted">{t.description}</p>
    </div>
    <a
      class="ui-btn"
      href={resolve('/dashboard/[barId]', { barId: data.bar.slug })}
      >{t.openDesk}</a
    >
  </header>

  <ul
    class="divide-y divide-ui-line rounded-sm border border-ui-line bg-ui-panel"
  >
    {#each sections as section (section.key)}
      <li
        class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 class="font-semibold">{t.sections[section.key].title}</h2>
          <p class="mt-1 text-sm text-ui-muted">
            {t.sections[section.key].detail}
          </p>
        </div>
        <!-- External link to the Django admin on the backend origin. -->
        <!-- eslint-disable svelte/no-navigation-without-resolve -->
        <a
          class="ui-btn shrink-0"
          href={`${backendAdminUrl}${section.path}`}
          target="_blank"
          rel="noopener noreferrer">{t.open}<span aria-hidden="true">↗</span></a
        >
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
      </li>
    {/each}
  </ul>
</div>
