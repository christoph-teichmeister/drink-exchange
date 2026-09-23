<script lang="ts">
  import type { DrinkHistoryPoint } from '$lib/stores/board'

  export type ChartSeries = {
    id: string
    name: string
    history: DrinkHistoryPoint[]
    color?: string
  }

  export const DEFAULT_SERIES_COLORS = [
    '#3056ff',
    '#ff6d5f',
    '#7dd3fc',
    '#a855f7',
    '#fb7185',
    '#38bdf8',
    '#22c55e',
    '#facc15'
  ]

  export let series: ChartSeries[] = []
  export let width = 640
  export let height = 240

  const minVisibleDelta = 0.2

  const normalizeHistory = (history: DrinkHistoryPoint[]) =>
    history.length ? history.slice() : [{ timestamp: '', price: 0 }]

  const allPrices = () =>
    series.flatMap((entry) => entry.history.map((point) => point.price))

  const calculateRange = () => {
    const prices = allPrices()
    if (!prices.length) {
      return { min: 0, max: minVisibleDelta, range: minVisibleDelta }
    }
    const rawMin = Math.min(...prices)
    const rawMax = Math.max(...prices)
    const delta = rawMax - rawMin
    if (Math.abs(delta) < minVisibleDelta) {
      const center = (rawMax + rawMin) / 2
      const min = center - minVisibleDelta / 2
      const max = center + minVisibleDelta / 2
      return { min, max, range: minVisibleDelta }
    }
    return { min: rawMin, max: rawMax, range: delta }
  }

  const pointsForSeries = (history: DrinkHistoryPoint[], min: number, range: number) => {
    const sampled = normalizeHistory(history)
    if (sampled.length === 1) {
      sampled.push({ ...sampled[0] })
    }
    return sampled
      .map((point, index) => {
        const x = (index / (sampled.length - 1 || 1)) * width
        const normalizedPrice = point.price - min
        const y = height - Math.min(Math.max((normalizedPrice / range) * height, 0), height)
        return `${x},${y}`
      })
      .join(' ')
  }

  const seriesWithPaths = () => {
    const { min, range } = calculateRange()
    return series.map((entry, index) => ({
      id: entry.id,
      points: pointsForSeries(entry.history, min, range),
      color: entry.color ?? DEFAULT_SERIES_COLORS[index % DEFAULT_SERIES_COLORS.length]
    }))
  }

  $: chartPaths = seriesWithPaths()
</script>

<svg viewBox={`0 0 ${width} ${height}`} class="h-full w-full" preserveAspectRatio="none">
  {#if chartPaths.length}
    {#each chartPaths as line (line.id)}
      <polyline
        points={line.points}
        fill="none"
        stroke={line.color}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    {/each}
  {:else}
      <polyline
        points={`0,${height / 2} ${width},${height / 2}`}
        fill="none"
        stroke="#9fb6cd"
        stroke-width="2"
        stroke-linecap="round"
      />
  {/if}
</svg>
