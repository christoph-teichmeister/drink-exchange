// Series colors tuned for the dark terminal. Pure green/red are reserved for
// up/down moves so a line color never reads as a price direction.
export const SERIES_COLORS = [
  '#4cc2ff',
  '#ffb020',
  '#c38bff',
  '#ff8a4c',
  '#5fe0cf',
  '#ff7ab8',
  '#b6e35b',
  '#8fa3ff'
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
  // Coordinates of the newest point, used for the end-of-line marker.
  last: { x: number; y: number }
}

export type PriceRange = { min: number; max: number }

// Smallest visible price range so flat series are drawn mid-height instead of
// collapsing onto the axis.
const MIN_VISIBLE_DELTA = 0.2
const RANGE_PADDING = 0.08

export const priceRange = (series: ChartSeries[]): PriceRange => {
  const prices = series.flatMap((entry) =>
    entry.history.map((point) => point.price)
  )
  if (!prices.length) {
    return { min: 0, max: MIN_VISIBLE_DELTA }
  }
  let min = Math.min(...prices)
  let max = Math.max(...prices)
  if (max - min < MIN_VISIBLE_DELTA) {
    const center = (max + min) / 2
    min = center - MIN_VISIBLE_DELTA / 2
    max = center + MIN_VISIBLE_DELTA / 2
  }
  const padding = (max - min) * RANGE_PADDING
  return { min: min - padding, max: max + padding }
}

// Evenly spaced gridline values across the range (inclusive of both ends).
export const gridValues = ({ min, max }: PriceRange, count = 4): number[] =>
  Array.from(
    { length: count + 1 },
    (_, index) => min + ((max - min) * index) / count
  )

export const valueToY = (
  value: number,
  { min, max }: PriceRange,
  height: number
) => {
  const scaled = ((value - min) / (max - min)) * height
  return height - Math.min(Math.max(scaled, 0), height)
}

export const buildChartPaths = (
  series: ChartSeries[],
  width: number,
  height: number,
  range: PriceRange = priceRange(series)
): ChartPath[] =>
  series.map((entry) => {
    const sampled = entry.history.length
      ? entry.history.slice()
      : [{ price: range.min }]
    if (sampled.length === 1) {
      sampled.push({ ...sampled[0] })
    }
    const coordinates = sampled.map((point, index) => ({
      x: (index / (sampled.length - 1)) * width,
      y: valueToY(point.price, range, height)
    }))
    return {
      id: entry.id,
      points: coordinates.map(({ x, y }) => `${x},${y}`).join(' '),
      color: entry.color,
      last: coordinates[coordinates.length - 1]
    }
  })
