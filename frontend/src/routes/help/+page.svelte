<script lang="ts">
  import { getI18nContext } from '$lib/i18n'

  const { translations } = getI18nContext()
  const t = $derived($translations.help)
</script>

<svelte:head>
  <title>{t.pageTitle}</title>
</svelte:head>

<div class="max-w-4xl space-y-8">
  <header>
    <p class="ui-label">{t.pageTitle}</p>
    <h1 class="mt-1 text-2xl font-semibold tracking-tight">{t.title}</h1>
    <p class="mt-2 text-ui-muted">{t.intro}</p>
  </header>

  {#each t.sections as section (section.title)}
    <section class="rounded-sm border border-ui-line bg-ui-panel">
      <h2 class="border-b border-ui-line px-5 py-3 font-semibold">
        {section.title}
      </h2>
      <dl class="divide-y divide-ui-line">
        {#each section.items as item (item.term)}
          <div class="grid gap-1 px-5 py-3 md:grid-cols-[14rem_1fr] md:gap-6">
            <dt class="font-medium">{item.term}</dt>
            <dd class="text-ui-muted">{item.detail}</dd>
          </div>
        {/each}
      </dl>
    </section>
  {/each}
</div>
