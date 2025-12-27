<script lang="ts">
  import type { DrinkHistoryPoint } from '$lib/stores/board'

  export let history: DrinkHistoryPoint[] = []

  const width = 320
  const height = 140

  const normalizeHistory = () => {
    if (history.length) {
      return history
    }
    return [{ timestamp: '', price: 0 }]
  }

  const buildPoints = () => {
    const sampled = normalizeHistory()
    const prices = sampled.map((point) => point.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const range = maxPrice - minPrice || 1

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

  $: points = buildPoints()
  $: stops = buildGradientStops()
</script>

<svg
  viewBox={`0 0 ${width} ${height}`}
  class="h-full w-full"
  preserveAspectRatio="none"
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
