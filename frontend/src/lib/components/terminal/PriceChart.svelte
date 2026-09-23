<script lang="ts">
  import type { Locale } from '$lib/i18n'
  import type { DrinkHistoryPoint } from '$lib/stores/board'
  import {
    buildChartPaths,
    gridValues,
    priceRange,
    valueToY,
    type ChartSeries
  } from '$lib/utils/chart'
  import { formatPrice, formatTime } from '$lib/utils/format'

  let {
    series,
    locale,
    label,
    showTimes = true,
    stale = false
  }: {
    series: ChartSeries<DrinkHistoryPoint>[]
    locale: Locale
    label: string
    showTimes?: boolean
    stale?: boolean
  } = $props()

  // Measured in CSS pixels so the viewBox matches the element 1:1 and text is
  // never stretched.
  let width = $state(0)
  let height = $state(0)

  const AXIS_WIDTH = 64
  const AXIS_HEIGHT = 24
  // Keeps the topmost gridline label inside the viewBox.
  const TOP_PADDING = 10
  const plotWidth = $derived(Math.max(0, width - AXIS_WIDTH))
  const plotHeight = $derived(Math.max(0, height - AXIS_HEIGHT - TOP_PADDING))

  const range = $derived(priceRange(series))
  const grid = $derived(gridValues(range, 4))
  const paths = $derived(
    plotWidth > 0 && plotHeight > 0
      ? buildChartPaths(series, plotWidth, plotHeight, range)
      : []
  )

  // Time labels from the longest series: first, middle and last sample.
  const timeLabels = $derived.by(() => {
    const longest = series.reduce<DrinkHistoryPoint[]>(
      (current, entry) =>
        entry.history.length > current.length ? entry.history : current,
      []
    )
    if (longest.length < 2 || !showTimes) {
      return []
    }
    const indexes = [
      0,
      Math.floor((longest.length - 1) / 2),
      longest.length - 1
    ]
    return indexes.map((index) => ({
      x: (index / (longest.length - 1)) * plotWidth,
      text: formatTime(longest[index].timestamp, locale, true) ?? '',
      anchor:
        index === 0 ? 'start' : index === longest.length - 1 ? 'end' : 'middle'
    }))
  })
</script>

<div
  class={`relative h-full min-h-[12rem] w-full transition-opacity ${stale ? 'opacity-45' : ''}`}
  bind:clientWidth={width}
  bind:clientHeight={height}
>
  {#if width > 0 && height > 0}
    <svg
      viewBox={`0 ${-TOP_PADDING} ${width} ${height}`}
      class="absolute inset-0 h-full w-full"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      {#each grid as value (value)}
        {@const y = valueToY(value, range, plotHeight)}
        <line
          x1="0"
          x2={plotWidth}
          y1={y}
          y2={y}
          stroke="var(--term-line)"
          stroke-width="1"
          shape-rendering="crispEdges"
        />
        <text
          x={plotWidth + 10}
          {y}
          dominant-baseline="middle"
          class="fill-term-muted font-mono text-[12px]"
          >{formatPrice(value, locale)}</text
        >
      {/each}
      {#each timeLabels as tick (tick.x)}
        <text
          x={tick.x}
          y={plotHeight + 17}
          text-anchor={tick.anchor}
          class="fill-term-dim font-mono text-[11px]">{tick.text}</text
        >
      {/each}
      {#each paths as line (line.id)}
        <polyline
          points={line.points}
          fill="none"
          stroke={line.color}
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <circle cx={line.last.x} cy={line.last.y} r="3.5" fill={line.color} />
      {/each}
    </svg>
  {/if}
</div>
