<script lang="ts">
  import { resolve } from '$app/paths'
  import { getI18nContext } from '$lib/i18n'

  let {
    currentPath = '/',
    onChoose = () => {}
  }: {
    currentPath?: string
    onChoose?: () => void
  } = $props()

  const { translations } = getI18nContext()

  const routes = [
    { key: 'board', href: resolve('/board') },
    { key: 'help', href: resolve('/help') }
  ] as const
</script>

<ul class="mt-6 space-y-4">
  {#each routes as route (route.key)}
    {@const nav = $translations.layout.navItems[route.key]}
    {#if currentPath === route.href}
      <li>
        <a
          href={route.href}
          aria-current="page"
          class="flex items-center justify-between rounded-2xl border border-market-accent/70 bg-market-accent/15 px-4 py-3 text-white transition hover:border-market-accent/90"
          onclick={onChoose}
        >
          <span>
            <strong class="block text-sm">{nav.title}</strong>
            <small class="text-white/70">{nav.description}</small>
          </span>
          <span class="text-xs tracking-[0.3em] text-market-accent/90 uppercase"
            >{$translations.layout.navNow}</span
          >
        </a>
      </li>
    {:else}
      <li>
        <a
          href={route.href}
          class="flex flex-col gap-1 rounded-2xl border border-white/10 px-4 py-3 text-white/80 transition hover:border-white/30 hover:text-white"
          onclick={onChoose}
        >
          <strong class="text-sm">{nav.title}</strong>
          <small class="text-white/60">{nav.description}</small>
        </a>
      </li>
    {/if}
  {/each}
</ul>
