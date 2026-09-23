<script lang="ts">
  import { resolve } from '$app/paths'
  import { goto } from '$app/navigation'
  import Card from '$lib/components/Card.svelte'
  import { getI18nContext } from '$lib/i18n'
  import { logoutUser } from '$lib/stores/auth'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()

  const { translations } = getI18nContext()

  // `||` on purpose: an empty description from the backend must fall back too.
  const description = $derived(
    data.bar.description?.trim() || $translations.dashboard.description
  )

  const handleLogout = async () => {
    try {
      await logoutUser(fetch)
    } catch (error) {
      console.error('Logout failed', error)
    }
    await goto(resolve('/login'), { invalidateAll: true })
  }
</script>

<svelte:head>
  <title>{$translations.dashboard.pageTitle} · {data.bar.name}</title>
</svelte:head>

<div class="space-y-6">
  <Card title={data.bar.name} description={$translations.dashboard.description}>
    <div class="space-y-4">
      <p class="text-sm text-white/70">{description}</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <a
          class="flex items-center justify-center rounded-2xl border border-market-accent/60 bg-market-accent/10 px-4 py-3 text-xs font-semibold tracking-[0.35em] text-market-accent uppercase transition hover:border-market-accent/80 hover:text-white"
          href={resolve('/board/[barId]', { barId: data.bar.slug })}
        >
          {$translations.dashboard.actions.board}
        </a>
        <a
          class="flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-xs font-semibold tracking-[0.35em] text-white uppercase transition hover:border-white/40"
          href={resolve('/admin/[barId]', { barId: data.bar.slug })}
        >
          {$translations.dashboard.actions.admin}
        </a>
      </div>
    </div>
    <button
      class="mt-4 w-full rounded-2xl border border-white/20 px-4 py-2 text-xs font-semibold tracking-[0.35em] text-white uppercase transition hover:border-market-primary/60"
      type="button"
      onclick={handleLogout}
    >
      {$translations.dashboard.logout}
    </button>
  </Card>
</div>
