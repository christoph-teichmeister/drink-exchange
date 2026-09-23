<script lang="ts">
  export let name = ''
  export let priceLabel = ''
  export let deltaLabel = ''
  export let trendLabel = ''
  export let deltaTone = 'text-white/70'
</script>

<article class="h-full min-h-[150px] rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
  <div class="flex h-full flex-col justify-between gap-3">
    <p class="text-xs uppercase tracking-[0.3em] text-white/40">
      <span class="block truncate">{name}</span>
    </p>
    <div class="space-y-1">
      <p class="text-2xl font-semibold text-white">{priceLabel}</p>
      <p class={`text-sm font-semibold ${deltaTone}`}>
        {deltaLabel} · {trendLabel}
      </p>
    </div>
  </div>
</article>
