<script module lang="ts">
  import type { DrinkHistoryPoint, TrendValue } from '$lib/stores/board'

  export type QuoteRow = {
    id: string
    name: string
    color: string
    price: number
    change: number | null
    percent: number | null
    direction: TrendValue
    lastMove: TrendValue
    history: DrinkHistoryPoint[]
  }
</script>

<script lang="ts">
  import Sparkline from '$lib/components/terminal/Sparkline.svelte'
  import type { Locale } from '$lib/i18n'
  import { formatDelta, formatPercent, formatPrice } from '$lib/utils/format'

  let {
    rows,
    locale,
    labels,
    stale = false,
    emptyLabel
  }: {
    rows: QuoteRow[]
    locale: Locale
    labels: {
      drink: string
      last: string
      change: string
      changePct: string
      trend: string
    }
    stale?: boolean
    emptyLabel: string
  } = $props()

  const tone = (direction: TrendValue) =>
    direction === 'up'
      ? 'text-term-up'
      : direction === 'down'
        ? 'text-term-down'
        : 'text-term-muted'

  const ARROWS: Record<TrendValue, string> = { up: '▲', down: '▼', flat: '' }

  const columns =
    'grid grid-cols-[minmax(0,1fr)_auto_10ch] items-center gap-x-[clamp(0.75rem,1.6vw,2.5rem)] md:grid-cols-[minmax(0,1fr)_auto_8ch_10ch_minmax(4rem,9vw)]'
</script>

<div role="table" class="flex h-full min-h-0 flex-col">
  <div
    role="row"
    class={`${columns} border-b border-term-line px-[clamp(1rem,1.6vw,2rem)] py-2 text-[clamp(0.65rem,0.75vw,0.9rem)] font-medium tracking-wider text-term-muted uppercase`}
  >
    <span role="columnheader">{labels.drink}</span>
    <span role="columnheader" class="text-right">{labels.last}</span>
    <span role="columnheader" class="hidden text-right md:block"
      >{labels.change}</span
    >
    <span role="columnheader" class="text-right">{labels.changePct}</span>
    <span role="columnheader" class="hidden text-right md:block"
      >{labels.trend}</span
    >
  </div>

  {#if rows.length}
    <div
      role="rowgroup"
      class={`grid min-h-0 flex-1 auto-rows-fr transition-opacity ${stale ? 'opacity-45' : ''}`}
    >
      {#each rows as row (row.id)}
        {#key row.price}
          <div
            role="row"
            class={`${columns} border-b border-term-line px-[clamp(1rem,1.6vw,2rem)] py-[clamp(0.5rem,1vh,1.25rem)] ${
              stale
                ? ''
                : row.lastMove === 'up'
                  ? 'term-flash-up'
                  : row.lastMove === 'down'
                    ? 'term-flash-down'
                    : ''
            }`}
          >
            <span role="cell" class="flex min-w-0 items-center gap-3">
              <span
                class="h-[0.7em] w-[0.7em] shrink-0"
                style:background-color={row.color}
                aria-hidden="true"
              ></span>
              <span
                class="truncate text-[clamp(1rem,1.9vw,2.5rem)] font-semibold tracking-tight"
                >{row.name}</span
              >
            </span>
            <span
              role="cell"
              class="text-right font-mono text-[clamp(1.4rem,3vw,4rem)] leading-none font-semibold"
            >
              {formatPrice(row.price, locale)}
            </span>
            <span
              role="cell"
              class={`hidden text-right font-mono text-[clamp(0.9rem,1.4vw,1.9rem)] md:block ${tone(row.direction)}`}
            >
              {row.change === null ? '—' : formatDelta(row.change, locale)}
            </span>
            <span
              role="cell"
              class={`text-right font-mono text-[clamp(0.9rem,1.4vw,1.9rem)] whitespace-nowrap ${tone(row.direction)}`}
            >
              <span aria-hidden="true">{ARROWS[row.direction]}</span>
              {row.percent === null ? '—' : formatPercent(row.percent, locale)}
            </span>
            <span
              role="cell"
              class="hidden h-[clamp(1.5rem,4vh,3rem)] md:block"
            >
              <Sparkline history={row.history} direction={row.direction} />
            </span>
          </div>
        {/key}
      {/each}
    </div>
  {:else}
    <p class="px-6 py-8 text-term-muted">{emptyLabel}</p>
  {/if}
</div>
