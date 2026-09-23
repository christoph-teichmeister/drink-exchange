export const SERIES_COLORS = [
  '#3056ff',
  '#ff6d5f',
  '#3b82f6',
  '#a855f7',
  '#fb7185',
  '#38bdf8',
  '#22c55e',
  '#facc15'
] as const

export const seriesColor = (index: number) =>
  SERIES_COLORS[index % SERIES_COLORS.length]

type PricePoint = { price: number }

export type ChartSeries<P extends PricePoint = PricePoint> = {
  id: string
  name: string
  history: P[]
  color: string
}

export type ChartPath = {
  id: string
  points: string
  color: string
}

// Smallest visible price range so flat series are drawn mid-height instead of
// collapsing onto the axis.
const MIN_VISIBLE_DELTA = 0.2

const calculateRange = (series: ChartSeries[]) => {
  const prices = series.flatMap((entry) =>
    entry.history.map((point) => point.price)
  )
  if (!prices.length) {
    return { min: 0, range: MIN_VISIBLE_DELTA }
  }
  const rawMin = Math.min(...prices)
  const rawMax = Math.max(...prices)
  const delta = rawMax - rawMin
  if (Math.abs(delta) < MIN_VISIBLE_DELTA) {
    const center = (rawMax + rawMin) / 2
    return { min: center - MIN_VISIBLE_DELTA / 2, range: MIN_VISIBLE_DELTA }
  }
  return { min: rawMin, range: delta }
}

const pointsForSeries = (
  history: PricePoint[],
  min: number,
  range: number,
  width: number,
  height: number
) => {
  const sampled = history.length ? history.slice() : [{ price: min }]
  if (sampled.length === 1) {
    sampled.push({ ...sampled[0] })
  }
  return sampled
    .map((point, index) => {
      const x = (index / (sampled.length - 1)) * width
      const scaled = ((point.price - min) / range) * height
      const y = height - Math.min(Math.max(scaled, 0), height)
      return `${x},${y}`
    })
    .join(' ')
}

export const buildChartPaths = (
  series: ChartSeries[],
  width: number,
  height: number
): ChartPath[] => {
  const { min, range } = calculateRange(series)
  return series.map((entry) => ({
    id: entry.id,
    points: pointsForSeries(entry.history, min, range, width, height),
    color: entry.color
  }))
}
