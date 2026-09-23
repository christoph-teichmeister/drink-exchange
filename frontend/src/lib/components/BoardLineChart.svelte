<script lang="ts">
  import { dev } from '$app/environment'
  import type { DrinkHistoryPoint } from '$lib/stores/board'
  import { translations } from '$lib/i18n'

  export let history: DrinkHistoryPoint[] = []

  const width = 320
  const height = 140
  const priceFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  const normalizeHistory = () => {
    if (history.length) {
      return history.slice()
    }
    return [{ timestamp: '', price: 0 }]
  }

  const buildPoints = () => {
    const sampled = normalizeHistory()
    if (sampled.length === 1) {
      sampled.push({ ...sampled[0] })
    }
    const prices = sampled.map((point) => point.price)
    let minPrice = Math.min(...prices)
    let maxPrice = Math.max(...prices)
    const delta = maxPrice - minPrice
    const minVisibleDelta = 0.2
    let range = delta || minVisibleDelta
    if (delta < minVisibleDelta) {
      const center = (maxPrice + minPrice) / 2
      minPrice = center - minVisibleDelta / 2
      maxPrice = center + minVisibleDelta / 2
      range = minVisibleDelta
    }

    return sampled
      .map((point, index) => {
        const x = (index / (sampled.length - 1 || 1)) * width
        const y = height - ((point.price - minPrice) / range) * height
        return `${x},${y}`
      })
      .join(' ')
  }

  const buildGradientStops = () => {
    return [
      { offset: 0, color: 'rgba(255, 255, 255, 0.2)' },
      { offset: 1, color: 'rgba(255, 255, 255, 0)' }
    ]
  }

  const formatTooltipEntry = (point: DrinkHistoryPoint) => {
    const parsed = new Date(point.timestamp)
    if (Number.isNaN(parsed.getTime())) {
      return null
    }
    return `${parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${priceFormatter.format(
      point.price
    )}`
  }

  const tooltipEntries = () =>
    history
      .slice(-4)
      .map(formatTooltipEntry)
      .filter((entry): entry is string => typeof entry === 'string')

  $: points = buildPoints()
  $: stops = buildGradientStops()
  $: formattedTooltip = tooltipEntries()
  $: tooltipText = formattedTooltip.length
    ? formattedTooltip.join(' · ')
    : $translations.board.chart.tooltip.empty
  $: tooltipSummary = formattedTooltip.length
    ? formattedTooltip[formattedTooltip.length - 1]
    : $translations.board.chart.tooltip.empty

  $: if (dev) {
    console.debug('BoardLineChart history points', history.length, points)
  }
</script>

<div class="relative h-full w-full">
  <svg
    viewBox={`0 0 ${width} ${height}`}
    class="h-full w-full"
    preserveAspectRatio="none"
    title={tooltipText}
  >
    <defs>
      <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        {#each stops as stop}
          <stop offset={stop.offset} stop-color={stop.color} />
        {/each}
      </linearGradient>
    </defs>
    <polyline
      points={points}
      fill="none"
      stroke="white"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <polygon
      points={`${points} ${width},${height} 0,${height}`}
      fill="url(#chart-gradient)"
      opacity="0.45"
    />
  </svg>
  <span
    class="absolute top-2 left-2 text-[0.55rem] uppercase tracking-[0.4em] text-white/60"
    title={tooltipText}
  >
    {$translations.board.chart.tooltip.label}: {tooltipSummary}
  </span>
  {#if dev}
    <span class="absolute bottom-1 right-2 text-[0.55rem] uppercase tracking-[0.4em] text-white/60">
      {$translations.board.chart.pointsLabel}: {history.length}
    </span>
  {/if}
</div>
