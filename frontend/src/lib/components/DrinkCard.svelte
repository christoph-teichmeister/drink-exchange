<script lang="ts">
  let {
    name = '',
    priceLabel = '',
    deltaLabel = '',
    trendLabel = '',
    deltaTone = 'text-white/70',
    stale = false
  }: {
    name?: string
    priceLabel?: string
    deltaLabel?: string
    trendLabel?: string
    deltaTone?: string
    stale?: boolean
  } = $props()
</script>

<article
  class={`h-full min-h-[150px] rounded-2xl border border-white/10 bg-white/5 p-4 text-sm transition-opacity ${stale ? 'opacity-50' : ''}`}
>
  <div class="flex h-full flex-col justify-between gap-3">
    <p class="text-xs tracking-[0.3em] text-white/40 uppercase">
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
