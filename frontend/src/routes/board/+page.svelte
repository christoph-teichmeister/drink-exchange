<script lang="ts">
  import { resolve } from '$app/paths'
  import { getI18nContext } from '$lib/i18n'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()

  const { translations } = getI18nContext()
</script>

<svelte:head>
  <title>{$translations.board.lobby.pageTitle}</title>
</svelte:head>

<section class="space-y-7">
  <header class="space-y-2">
    <p class="text-xs tracking-[0.4em] text-white/50 uppercase">
      {$translations.board.lobby.subtitle}
    </p>
    <h1 class="text-3xl font-semibold text-white">
      {$translations.board.lobby.pageTitle}
    </h1>
    <p class="max-w-3xl text-sm text-white/70">
      {$translations.board.lobby.description}
    </p>
  </header>

  {#if data.bars.length}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each data.bars as bar (bar.slug)}
        <article
          class="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/50 transition hover:border-market-accent/60"
        >
          <div>
            <p class="text-xs tracking-[0.4em] text-white/50 uppercase">
              {bar.slug}
            </p>
            <h2 class="mt-2 text-xl font-semibold text-white">{bar.name}</h2>
            {#if bar.description}
              <p class="mt-2 text-sm text-white/60">{bar.description}</p>
            {/if}
          </div>
          <a
            class="mt-6 inline-flex items-center justify-center rounded-full border border-market-accent/70 px-4 py-2 text-xs font-semibold tracking-[0.4em] text-market-accent uppercase transition hover:border-market-accent/90 hover:text-white"
            href={resolve('/dashboard/[barId]', { barId: bar.slug })}
          >
            {$translations.board.lobby.openDashboard}
          </a>
        </article>
      {/each}
    </div>
  {:else}
    <div
      class="rounded-2xl border border-dashed border-white/30 bg-white/5 p-6 text-sm text-white/60"
    >
      {$translations.board.lobby.empty}
    </div>
  {/if}
</section>
