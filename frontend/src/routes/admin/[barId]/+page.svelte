<script lang="ts">
  import { goto } from '$app/navigation'
  import Card from '$lib/components/Card.svelte'
  import { translations } from '$lib/i18n'
  import type { PageData } from './$types'

  export let data: PageData

  const goBack = () => {
    if (!data.bar?.slug) {
      goto('/board')
      return
    }
    goto(`/dashboard/${data.bar.slug}`)
  }
</script>

<svelte:head>
  <title>{$translations.admin.pageTitle} · {data.bar.name}</title>
</svelte:head>

<div class="space-y-4">
  <button
    type="button"
    class="flex items-center gap-2 rounded-2xl border border-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70 transition hover:border-market-accent/70"
    on:click={goBack}
  >
    <span aria-hidden="true">←</span>
    <span>{$translations.board.backButton}</span>
  </button>

  <Card
    title={`${data.bar.name} · ${$translations.admin.pageTitle}`}
    description={$translations.admin.description}
  >
    <div class="rounded-2xl border border-dashed border-white/30 bg-white/5 px-4 py-5 text-sm text-white/60">
      {$translations.admin.emptyState}
    </div>
  </Card>
</div>
