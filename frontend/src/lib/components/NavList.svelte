<script lang="ts">
  import type { NavigationItem } from '$lib/i18n'
  import { translations } from '$lib/i18n'

  export let navItems: NavigationItem[] = []
  export let currentPath = '/'
  export let onChoose: () => void = () => {}
</script>

<ul class="mt-6 space-y-4">
  {#each navItems as nav}
    {#if currentPath === nav.path}
      <li>
        <a
          href={nav.path}
          class="flex items-center justify-between rounded-2xl border border-market-accent/70 bg-market-accent/15 px-4 py-3 text-white transition hover:border-market-accent/90"
          on:click={onChoose}
        >
          <span>
            <strong class="block text-sm">{nav.title}</strong>
            <small class="text-white/70">{nav.description}</small>
          </span>
          <span class="text-xs uppercase tracking-[0.3em] text-market-accent/90">{$translations.layout.navNow}</span>
        </a>
      </li>
    {:else}
      <li>
        <a
          href={nav.path}
          class="flex flex-col gap-1 rounded-2xl border border-white/10 px-4 py-3 text-white/80 transition hover:border-white/30 hover:text-white"
          on:click={onChoose}
        >
          <strong class="text-sm">{nav.title}</strong>
          <small class="text-white/60">{nav.description}</small>
        </a>
      </li>
    {/if}
  {/each}
</ul>
