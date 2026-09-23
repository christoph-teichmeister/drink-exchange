import { describe, expect, it } from 'vitest'
import {
  buildChartPaths,
  gridValues,
  priceRange,
  seriesColor,
  SERIES_COLORS,
  valueToY
} from '$lib/utils/chart'

const series = (prices: number[]) => ({
  id: 'a',
  name: 'A',
  color: '#fff',
  history: prices.map((price) => ({ price }))
})

describe('priceRange', () => {
  it('pads the observed range so lines never touch the edges', () => {
    const range = priceRange([series([5, 7])])
    expect(range.min).toBeLessThan(5)
    expect(range.max).toBeGreaterThan(7)
  })

  it('widens flat series to a minimum visible range', () => {
    const range = priceRange([series([5, 5])])
    expect(range.max - range.min).toBeGreaterThanOrEqual(0.2)
    expect((range.max + range.min) / 2).toBeCloseTo(5)
  })
})

describe('gridValues', () => {
  it('returns count + 1 evenly spaced values including both ends', () => {
    expect(gridValues({ min: 0, max: 4 }, 4)).toEqual([0, 1, 2, 3, 4])
  })
})

describe('valueToY', () => {
  it('maps the range onto the plot height with the maximum at the top', () => {
    expect(valueToY(10, { min: 0, max: 10 }, 100)).toBe(0)
    expect(valueToY(0, { min: 0, max: 10 }, 100)).toBe(100)
    expect(valueToY(20, { min: 0, max: 10 }, 100)).toBe(0)
  })
})

describe('buildChartPaths', () => {
  it('spreads points across the width and exposes the last point', () => {
    const [path] = buildChartPaths([series([1, 2, 3])], 200, 100, {
      min: 1,
      max: 3
    })
    expect(path.points).toBe('0,100 100,50 200,0')
    expect(path.last).toEqual({ x: 200, y: 0 })
  })

  it('draws a single sample as a horizontal line', () => {
    const [path] = buildChartPaths([series([2])], 200, 100, { min: 1, max: 3 })
    expect(path.points).toBe('0,50 200,50')
  })
})

describe('seriesColor', () => {
  it('cycles through the palette', () => {
    expect(seriesColor(0)).toBe(SERIES_COLORS[0])
    expect(seriesColor(SERIES_COLORS.length)).toBe(SERIES_COLORS[0])
  })
})
