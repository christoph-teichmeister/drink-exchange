<script lang="ts">
  import { page } from '$app/stores';
  import Badge from '$lib/components/Badge.svelte';
  import { translations } from '$lib/i18n';

  let currentPath = '/';
  $: currentPath = $page.url.pathname;
</script>

<div class="min-h-screen bg-market-surface">
  <header class="border-b border-white/10 bg-gradient-to-b from-market-surface/90 to-market-surface/50 px-6 py-4">
    <div class="flex items-center justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.4em] text-white/50">{$translations.layout.headerSubtitle}</p>
        <p class="text-2xl font-semibold text-white">{$translations.layout.headerTitle}</p>
      </div>
      <Badge variant="success">{$translations.layout.headerBadge}</Badge>
    </div>
  </header>
  <div class="flex min-h-[calc(100vh-96px)]">
    <nav class="w-64 border-r border-white/5 bg-white/5 px-6 py-8">
      <p class="text-xs uppercase tracking-[0.4em] text-white/40">{$translations.layout.navLabel}</p>
      <ul class="mt-6 space-y-4">
        {#each $translations.layout.navItems as nav}
          {#if currentPath === nav.path}
            <li>
              <a
                href={nav.path}
                class="flex items-center justify-between rounded-2xl border border-market-accent/70 bg-market-accent/15 px-4 py-3 text-white transition hover:border-market-accent/90"
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
              >
                <strong class="text-sm">{nav.title}</strong>
                <small class="text-white/60">{nav.description}</small>
              </a>
            </li>
          {/if}
        {/each}
      </ul>
    </nav>
    <main class="flex-1 p-8">
      <slot />
    </main>
  </div>
</div>
