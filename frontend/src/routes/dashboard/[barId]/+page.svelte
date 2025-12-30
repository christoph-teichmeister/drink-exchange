<script lang="ts">
  import { goto } from '$app/navigation'
  import Card from '$lib/components/Card.svelte'
  import { logoutUser } from '$lib/stores/auth'
  import { translations } from '$lib/i18n'
  import type { PageData } from './$types'

  export let data: PageData

  const handleLogout = async () => {
    await logoutUser(fetch)
    goto('/login')
  }
</script>

<svelte:head>
  <title>{$translations.dashboard.pageTitle} · {data.bar.name}</title>
</svelte:head>

<div class="space-y-6">
  <Card title={data.bar.name} description={$translations.dashboard.description}>
    <div class="space-y-4">
      <p class="text-sm text-white/70">{data.bar.description ?? $translations.dashboard.description}</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <a
          class="flex items-center justify-center rounded-2xl border border-market-accent/60 bg-market-accent/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-market-accent transition hover:border-market-accent/80 hover:text-white"
          href={`/board/${data.bar.slug}`}
        >
          {$translations.dashboard.actions.board}
        </a>
        <a
          class="flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:border-white/40"
          href={`/admin/${data.bar.slug}`}
        >
          {$translations.dashboard.actions.admin}
        </a>
      </div>
    </div>
    <button
      class="mt-4 w-full rounded-2xl border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:border-market-primary/60"
      type="button"
      on:click={handleLogout}
    >
      {$translations.dashboard.logout}
    </button>
  </Card>
</div>
