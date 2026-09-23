<script lang="ts">
  import { resolve } from '$app/paths'
  import { untrack } from 'svelte'
  import DrinkRow from '$lib/components/admin/DrinkRow.svelte'
  import EventRow from '$lib/components/admin/EventRow.svelte'
  import SettingsForm from '$lib/components/admin/SettingsForm.svelte'
  import { backendAdminUrl } from '$lib/config'
  import { getI18nContext } from '$lib/i18n'
  import type { DrinkConfig, EventConfig } from '$lib/types'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()

  const { translations } = getI18nContext()
  const t = $derived($translations.admin)

  // Local copies so saved, created and deleted rows show up without a reload.
  let drinks = $state<DrinkConfig[]>(untrack(() => data.drinks))
  let events = $state<EventConfig[]>(untrack(() => data.events))
  const barSlug = untrack(() => data.bar.slug)

  const upsert = <T extends { id: number }>(list: T[], item: T) =>
    list.some((entry) => entry.id === item.id)
      ? list.map((entry) => (entry.id === item.id ? item : entry))
      : [...list, item]

  const advanced = [
    { key: 'bar', path: 'bars/bar/' },
    { key: 'drinks', path: 'market/drink/' },
    { key: 'events', path: 'events/eventdefinition/' },
    { key: 'trades', path: 'market/trade/' }
  ] as const
</script>

<svelte:head>
  <title>{t.pageTitle} · {data.bar.name}</title>
</svelte:head>

<div class="space-y-8">
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
    <a class="ui-btn" href={resolve('/dashboard/[barId]', { barId: barSlug })}
      >{t.openDesk}</a
    >
  </header>

  <section
    class="rounded-sm border border-ui-line bg-ui-panel"
    aria-labelledby="admin-settings"
  >
    <h2
      id="admin-settings"
      class="border-b border-ui-line px-5 py-3 font-semibold"
    >
      {t.settings.title}
    </h2>
    <div class="px-5 py-5">
      <SettingsForm settings={data.settings} />
    </div>
  </section>

  <section
    class="rounded-sm border border-ui-line bg-ui-panel"
    aria-labelledby="admin-drinks"
  >
    <div class="border-b border-ui-line px-5 py-3">
      <h2 id="admin-drinks" class="font-semibold">{t.drinks.title}</h2>
      <p class="mt-1 text-sm text-ui-muted">{t.drinks.hint}</p>
    </div>
    <ul class="divide-y divide-ui-line">
      {#each drinks as drink (drink.id)}
        <li>
          <DrinkRow
            {drink}
            {barSlug}
            onSaved={(saved) => (drinks = upsert(drinks, saved))}
            onDeleted={(id) =>
              (drinks = drinks.filter((entry) => entry.id !== id))}
          />
        </li>
      {/each}
      <li class="bg-ui-raised/40">
        <p class="ui-label px-5 pt-4">{t.drinks.newTitle}</p>
        <DrinkRow
          drink={null}
          {barSlug}
          onSaved={(saved) => (drinks = upsert(drinks, saved))}
        />
      </li>
    </ul>
  </section>

  <section
    class="rounded-sm border border-ui-line bg-ui-panel"
    aria-labelledby="admin-events"
  >
    <div class="border-b border-ui-line px-5 py-3">
      <h2 id="admin-events" class="font-semibold">{t.events.title}</h2>
      <p class="mt-1 text-sm text-ui-muted">{t.events.hint}</p>
    </div>
    <ul class="divide-y divide-ui-line">
      {#each events as event (event.id)}
        <li>
          <EventRow
            {event}
            {barSlug}
            {drinks}
            onSaved={(saved) => (events = upsert(events, saved))}
            onDeleted={(id) =>
              (events = events.filter((entry) => entry.id !== id))}
          />
        </li>
      {/each}
      <li class="bg-ui-raised/40">
        <p class="ui-label px-5 pt-4">{t.events.newTitle}</p>
        <EventRow
          event={null}
          {barSlug}
          {drinks}
          onSaved={(saved) => (events = upsert(events, saved))}
        />
      </li>
    </ul>
  </section>

  <footer class="border-t border-ui-line pt-4">
    <p class="ui-label">{t.advanced.title}</p>
    <p class="mt-1 text-sm text-ui-muted">{t.advanced.hint}</p>
    <ul class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {#each advanced as link (link.key)}
        <li>
          <!-- External link to the Django admin on the backend origin. -->
          <!-- eslint-disable svelte/no-navigation-without-resolve -->
          <a
            class="ui-link"
            href={`${backendAdminUrl}${link.path}`}
            target="_blank"
            rel="noopener noreferrer"
            >{t.advanced.links[link.key]}<span aria-hidden="true"> ↗</span></a
          >
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
        </li>
      {/each}
    </ul>
  </footer>
</div>
