<script lang="ts">
  import type { DrinkHistoryPoint, TrendValue } from '$lib/stores/board'
  import { buildChartPaths } from '$lib/utils/chart'

  let {
    history,
    direction
  }: { history: DrinkHistoryPoint[]; direction: TrendValue } = $props()

  const WIDTH = 120
  const HEIGHT = 32

  const path = $derived(
    buildChartPaths(
      [{ id: 'spark', name: 'spark', history, color: 'currentColor' }],
      WIDTH,
      HEIGHT
    )[0]
  )

  const tone = $derived(
    direction === 'up'
      ? 'text-term-up'
      : direction === 'down'
        ? 'text-term-down'
        : 'text-term-muted'
  )
</script>

<svg
  viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
  class={`h-full w-full ${tone}`}
  preserveAspectRatio="none"
  aria-hidden="true"
>
  <polyline
    points={path.points}
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linejoin="round"
    vector-effect="non-scaling-stroke"
  />
</svg>
