<script lang="ts">
  import { resolve } from '$app/paths'
  import Card from '$lib/components/Card.svelte'
  import { getI18nContext } from '$lib/i18n'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()

  const { translations } = getI18nContext()
</script>

<svelte:head>
  <title>{$translations.admin.pageTitle} · {data.bar.name}</title>
</svelte:head>

<div class="space-y-4">
  <a
    href={resolve('/dashboard/[barId]', { barId: data.bar.slug })}
    class="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-3 py-2 text-xs font-semibold tracking-[0.35em] text-white/70 uppercase transition hover:border-market-accent/70"
  >
    <span aria-hidden="true">←</span>
    <span>{$translations.board.backButton}</span>
  </a>

  <Card
    title={`${data.bar.name} · ${$translations.admin.pageTitle}`}
    description={$translations.admin.description}
  >
    <div
      class="rounded-2xl border border-dashed border-white/30 bg-white/5 px-4 py-5 text-sm text-white/60"
    >
      {$translations.admin.emptyState}
    </div>
  </Card>
</div>
