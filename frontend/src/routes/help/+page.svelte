<script lang="ts">
  import { translations } from '$lib/i18n'
</script>

<svelte:head>
  <title>{$translations.help.pageTitle}</title>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-10">
  <section class="space-y-3 rounded-2xl border border-white/5 bg-market-surface/40 p-6">
    <p class="text-xs uppercase tracking-[0.4em] text-market-accent/70">
      {$translations.layout.navLabel}
    </p>
    <div class="space-y-3">
      <h1 class="text-3xl font-semibold text-white">{$translations.help.hero.title}</h1>
      <p class="text-sm text-white/70">{$translations.help.hero.subtitle}</p>
    </div>
  </section>

  <section class="space-y-4 rounded-2xl border border-white/5 bg-market-surface/60 p-6">
    {#each $translations.help.introParagraphs as paragraph}
      <p class="text-sm text-white/70">{paragraph}</p>
    {/each}
  </section>

  {#each $translations.help.learnSections as section}
    <section class="space-y-4 rounded-2xl border border-white/5 bg-market-surface/70 p-6">
      <div class="space-y-2">
        <h2 class="text-2xl font-semibold text-white">{section.title}</h2>
        <p class="text-sm text-white/70">{section.description}</p>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        {#each section.cards as card}
          <article class="space-y-3 rounded-2xl border border-white/5 bg-market-surface/90 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <h3 class="text-lg font-semibold text-white">{card.name}</h3>
            <p class="text-sm text-white/70">{card.summary}</p>
            <ul class="space-y-3 text-sm text-white/70">
              {#each card.actions as action}
                <li class="space-y-1">
                  <p class="text-white font-semibold">{action.label}</p>
                  <p class="text-white/70">{action.detail}</p>
                </li>
              {/each}
            </ul>
          </article>
        {/each}
      </div>
    </section>
  {/each}

  <section class="rounded-2xl border border-market-accent/40 bg-market-surface/80 p-6">
    <p class="text-sm text-white/70">{$translations.help.footer}</p>
  </section>
</div>
