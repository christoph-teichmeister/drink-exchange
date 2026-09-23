<script lang="ts">
  import { resolve } from '$app/paths'
  import { getI18nContext } from '$lib/i18n'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()

  const { translations } = getI18nContext()
  const t = $derived($translations.board.lobby)
</script>

<svelte:head>
  <title>{t.pageTitle}</title>
</svelte:head>

<section class="space-y-6">
  <header>
    <p class="ui-label">{t.subtitle}</p>
    <h1 class="mt-1 text-2xl font-semibold tracking-tight">{t.pageTitle}</h1>
    <p class="mt-2 max-w-2xl text-ui-muted">{t.description}</p>
  </header>

  {#if data.bars.length}
    <ul
      class="divide-y divide-ui-line rounded-sm border border-ui-line bg-ui-panel"
    >
      {#each data.bars as bar (bar.slug)}
        <li
          class="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
        >
          <div class="min-w-0">
            <h2 class="text-lg font-semibold tracking-tight">{bar.name}</h2>
            {#if bar.description}
              <p class="mt-1 text-sm text-ui-muted">{bar.description}</p>
            {/if}
            <p class="mt-1 font-mono text-xs text-ui-dim">{bar.slug}</p>
          </div>
          <div class="flex shrink-0 flex-wrap gap-2">
            <a
              class="ui-btn-primary"
              href={resolve('/dashboard/[barId]', { barId: bar.slug })}
              >{t.openDesk}</a
            >
            <a
              class="ui-btn"
              href={resolve('/board/[barId]', { barId: bar.slug })}
              >{t.openBoard}</a
            >
            <a
              class="ui-btn"
              href={resolve('/admin/[barId]', { barId: bar.slug })}
              >{t.openAdmin}</a
            >
          </div>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="rounded-sm border border-ui-line px-5 py-6 text-ui-muted">
      {t.empty}
    </p>
  {/if}
</section>
