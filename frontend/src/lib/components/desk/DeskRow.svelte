<script lang="ts">
  import { untrack } from 'svelte'
  import { interpolate, type Locale, type Translation } from '$lib/i18n'
  import type { TrendValue } from '$lib/stores/board'
  import { formatPercent, formatPrice } from '$lib/utils/format'

  let {
    name,
    color,
    price,
    percent,
    direction,
    stale,
    busy,
    locale,
    labels,
    onBook
  }: {
    name: string
    color: string
    price: number
    percent: number | null
    direction: TrendValue
    stale: boolean
    busy: boolean
    locale: Locale
    labels: Translation['dashboard']
    onBook: (qty: number) => void
  } = $props()

  const MAX_QTY = 20
  let qty = $state(1)

  // Flash only a background layer on price changes; re-rendering the whole row
  // would drop keyboard focus from the quantity buttons.
  let flash = $state<{ id: number; direction: 'up' | 'down' } | null>(null)
  let previousPrice = untrack(() => price)
  $effect(() => {
    const current = price
    if (current === previousPrice) {
      return
    }
    const nextDirection = current > previousPrice ? 'up' : 'down'
    previousPrice = current
    flash = { id: (flash?.id ?? 0) + 1, direction: nextDirection }
  })

  const tone = $derived(
    direction === 'up'
      ? 'text-ui-up'
      : direction === 'down'
        ? 'text-ui-down'
        : 'text-ui-muted'
  )
</script>

<li
  class="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_7rem_6rem_auto_auto] md:px-5"
>
  {#if flash && !stale}
    {#key flash.id}
      <span
        class={`pointer-events-none absolute inset-0 ${flash.direction === 'up' ? 'ui-flash-up' : 'ui-flash-down'}`}
        aria-hidden="true"
      ></span>
    {/key}
  {/if}
  <span class="flex min-w-0 items-center gap-3">
    <span
      class="h-2.5 w-2.5 shrink-0"
      style:background-color={color}
      aria-hidden="true"
    ></span>
    <span class="truncate text-lg font-semibold">{name}</span>
  </span>
  <span class={`text-right ${stale ? 'opacity-45' : ''}`}>
    <span class="block font-mono text-2xl font-semibold"
      >{formatPrice(price, locale)}</span
    >
    <span class={`block font-mono text-sm whitespace-nowrap sm:hidden ${tone}`}
      >{percent === null ? '—' : formatPercent(percent, locale)}</span
    >
  </span>
  <span
    class={`hidden text-right font-mono whitespace-nowrap sm:block ${tone} ${stale ? 'opacity-45' : ''}`}
  >
    {percent === null ? '—' : formatPercent(percent, locale)}
  </span>

  <div
    class="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:justify-end"
  >
    <div
      class="flex items-center rounded-sm border border-ui-line-strong"
      role="group"
      aria-label={interpolate(labels.qtyLabel, { drink: name })}
    >
      <button
        type="button"
        class="h-11 w-11 text-xl text-ui-muted hover:text-ui-text disabled:opacity-40"
        aria-label={labels.decrease}
        disabled={qty <= 1 || busy}
        onclick={() => (qty = Math.max(1, qty - 1))}>−</button
      >
      <output
        class="w-10 text-center font-mono text-lg font-semibold"
        aria-live="polite">{qty}</output
      >
      <button
        type="button"
        class="h-11 w-11 text-xl text-ui-muted hover:text-ui-text disabled:opacity-40"
        aria-label={labels.increase}
        disabled={qty >= MAX_QTY || busy}
        onclick={() => (qty = Math.min(MAX_QTY, qty + 1))}>+</button
      >
    </div>
    <button
      type="button"
      class="ui-btn-primary h-11 min-w-28 sm:hidden"
      disabled={busy}
      aria-busy={busy}
      aria-label={interpolate(labels.bookLabel, { qty, drink: name })}
      onclick={() => onBook(qty)}>{labels.book}</button
    >
  </div>
  <button
    type="button"
    class="ui-btn-primary hidden h-11 min-w-28 sm:inline-flex"
    disabled={busy}
    aria-busy={busy}
    aria-label={interpolate(labels.bookLabel, { qty, drink: name })}
    onclick={() => onBook(qty)}>{labels.book}</button
  >
</li>
