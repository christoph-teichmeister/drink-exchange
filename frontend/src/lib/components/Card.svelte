<script lang="ts">
  export let title = '';
  export let description = '';
  export let accent: boolean = false;
</script>

<section class={`rounded-2xl border bg-gradient-to-br from-white/5 to-white/0 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] ${accent ? 'border-market-accent/60' : 'border-white/10'}`}>
  {#if title}
    <header class="flex flex-col gap-1 pb-4">
      <p class="text-xs uppercase tracking-[0.4em] text-white/60">{title}</p>
      {#if description}
        <p class="text-2xl font-semibold text-white">{description}</p>
      {/if}
    </header>
  {/if}
  <div class="space-y-4 text-white/90">
    <slot />
  </div>
</section>
