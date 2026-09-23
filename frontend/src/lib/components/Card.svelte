<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    title = '',
    description = '',
    accent = false,
    children
  }: {
    title?: string
    description?: string
    accent?: boolean
    children: Snippet
  } = $props()
</script>

<section
  class={`rounded-2xl border bg-linear-to-br from-white/5 to-white/0 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] ${accent ? 'border-market-accent/60' : 'border-white/10'}`}
>
  {#if title}
    <header class="flex flex-col gap-1 pb-4">
      <p class="text-xs tracking-[0.4em] text-white/60 uppercase">{title}</p>
      {#if description}
        <p class="text-2xl font-semibold text-white">{description}</p>
      {/if}
    </header>
  {/if}
  <div class="space-y-4 text-white/90">
    {@render children()}
  </div>
</section>
