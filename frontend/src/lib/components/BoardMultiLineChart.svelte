<script lang="ts">
  import type { DrinkHistoryPoint } from '$lib/stores/board'
  import { buildChartPaths, type ChartSeries } from '$lib/utils/chart'

  let {
    series = [],
    width = 640,
    height = 240,
    label
  }: {
    series?: ChartSeries<DrinkHistoryPoint>[]
    width?: number
    height?: number
    label: string
  } = $props()

  // Re-computed whenever the series or dimensions change.
  const chartPaths = $derived(buildChartPaths(series, width, height))
</script>

<svg
  viewBox={`0 0 ${width} ${height}`}
  class="h-full w-full"
  preserveAspectRatio="none"
  role="img"
  aria-label={label}
>
  <title>{label}</title>
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
