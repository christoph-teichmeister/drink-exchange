<script module lang="ts">
  import type { TrendValue } from '$lib/stores/board'

  export type TapeItem = {
    id: string
    name: string
    price: number
    percent: number | null
    direction: TrendValue
  }
</script>

<script lang="ts">
  import type { Locale } from '$lib/i18n'
  import { formatPercent, formatPrice } from '$lib/utils/format'

  let {
    items,
    locale,
    label,
    stale = false
  }: {
    items: TapeItem[]
    locale: Locale
    label: string
    stale?: boolean
  } = $props()

  const ARROWS: Record<TrendValue, string> = { up: '▲', down: '▼', flat: '■' }

  // Roughly constant reading speed regardless of how many drinks a bar has.
  const duration = $derived(`${Math.max(20, items.length * 7)}s`)
</script>

<div
  class={`overflow-hidden border-b border-term-line bg-term-panel transition-opacity ${stale ? 'opacity-50' : ''}`}
  role="marquee"
  aria-label={label}
>
  <!-- The list is rendered twice so the -50% translation loops seamlessly. -->
  <div
    class="term-tape flex w-max whitespace-nowrap"
    style:--tape-duration={duration}
  >
    {#each [0, 1] as copy (copy)}
      <ul class="flex" aria-hidden={copy === 1}>
        {#each items as item (item.id)}
          <li
            class="flex items-baseline gap-3 border-r border-term-line px-6 py-2 font-mono text-[clamp(0.9rem,1.1vw,1.35rem)]"
          >
            <span class="font-sans font-semibold text-term-text uppercase"
              >{item.name}</span
            >
            <span class="text-term-text">{formatPrice(item.price, locale)}</span
            >
            <span
              class={item.direction === 'up'
                ? 'text-term-up'
                : item.direction === 'down'
                  ? 'text-term-down'
                  : 'text-term-muted'}
            >
              {ARROWS[item.direction]}
              {item.percent === null ? '' : formatPercent(item.percent, locale)}
            </span>
          </li>
        {/each}
      </ul>
    {/each}
  </div>
</div>
