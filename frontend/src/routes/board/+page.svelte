<script lang="ts">
  import { translations } from '$lib/i18n'
  import type { PageData } from './$types'

  export let data: PageData

  const boardUrl = (slug: string) => `/board/${slug}`
</script>

<svelte:head>
  <title>{$translations.board.lobby.pageTitle}</title>
</svelte:head>

<section class="space-y-7">
  <header class="space-y-2">
    <p class="text-xs uppercase tracking-[0.4em] text-white/50">
      {$translations.board.lobby.subtitle}
    </p>
    <h1 class="text-3xl font-semibold text-white">{$translations.board.lobby.pageTitle}</h1>
    <p class="max-w-3xl text-sm text-white/70">{$translations.board.lobby.description}</p>
  </header>

  {#if data.bars.length}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each data.bars as bar}
        <article class="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/50 transition hover:border-market-accent/60">
          <div>
            <p class="text-xs uppercase tracking-[0.4em] text-white/50">{bar.slug}</p>
            <h2 class="mt-2 text-xl font-semibold text-white">{bar.name}</h2>
            {#if bar.description}
              <p class="mt-2 text-sm text-white/60">{bar.description}</p>
            {/if}
          </div>
          <a
            class="mt-6 inline-flex items-center justify-center rounded-full border border-market-accent/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-market-accent transition hover:border-market-accent/90 hover:text-white"
            href={boardUrl(bar.slug)}
          >
            {$translations.board.lobby.openBoard}
          </a>
        </article>
      {/each}
    </div>
  {:else}
    <div class="rounded-2xl border border-dashed border-white/30 bg-white/5 p-6 text-sm text-white/60">
      {$translations.board.lobby.empty}
    </div>
  {/if}
</section>
