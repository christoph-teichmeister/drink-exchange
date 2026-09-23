<script lang="ts">
  import { resolve } from '$app/paths'
  import { onMount, untrack } from 'svelte'
  import Alert from '$lib/components/Alert.svelte'
  import Badge from '$lib/components/Badge.svelte'
  import DeskRow from '$lib/components/desk/DeskRow.svelte'
  import { getI18nContext, interpolate } from '$lib/i18n'
  import { createBoardStore, type BoardSnapshot } from '$lib/stores/board'
  import { seriesColor } from '$lib/utils/chart'
  import { formatPrice, formatTime } from '$lib/utils/format'
  import { changeFromBase, directionOf } from '$lib/utils/market'
  import { connectMarketFeed } from '$lib/utils/market-feed'
  import { recordTrade, TradeError } from '$lib/utils/trading'
  import { createMarketWebSocket } from '$lib/utils/ws-client'

  let {
    snapshot,
    description
  }: { snapshot: BoardSnapshot; description: string } = $props()

  const { locale, translations } = getI18nContext()
  const t = $derived($translations.dashboard)
  const terminal = $derived($translations.board.terminal)

  // Created once per mounted desk; the route `{#key}` remounts on bar change.
  const initialSnapshot = untrack(() => snapshot)
  const barSlug = initialSnapshot.bar.slug
  const board = createBoardStore(initialSnapshot)
  const marketWs = createMarketWebSocket(barSlug)

  let hydrated = $state(false)
  onMount(() => {
    hydrated = true
    return connectMarketFeed(board, marketWs)
  })

  type Booking = {
    id: number
    time: string
    drink: string
    qty: number
    before: number
    after: number
  }

  let pendingDrink = $state<string | null>(null)
  let bookings = $state<Booking[]>([])
  let feedback = $state<{ level: 'success' | 'danger'; text: string } | null>(
    null
  )

  const connection = $derived($board.connection)
  const isLive = $derived(connection.status === 'connected')
  const isStale = $derived(
    connection.status === 'reconnecting' ||
      connection.status === 'offline' ||
      connection.status === 'unauthorized'
  )

  const rows = $derived(
    $board.drinks.map((drink, index) => {
      const change = changeFromBase(drink.price, drink.base_price)
      return {
        id: drink.id,
        name: drink.name,
        color: seriesColor(index),
        price: drink.price,
        percent: change?.percent ?? null,
        direction: change ? directionOf(change.absolute) : drink.trend
      }
    })
  )

  const errorText = (error: unknown) => {
    if (error instanceof TradeError) {
      if (error.status === 401) return t.errors.session
      if (error.status === 403) return t.errors.forbidden
      if (error.status === 0) return t.errors.network
      if (error.detail) return error.detail
    }
    return t.errors.general
  }

  const book = async (drinkId: string, drinkName: string, qty: number) => {
    if (pendingDrink) {
      return
    }
    pendingDrink = drinkId
    feedback = null
    try {
      const result = await recordTrade(fetch, barSlug, drinkId, qty)
      // Apply the returned prices right away; the WebSocket frame follows.
      board.applyPriceUpdate(
        {
          prices: result.drinks.map((entry) => ({
            drink_id: entry.id,
            drink_name: entry.name,
            price: entry.price,
            base_price: entry.base_price
          }))
        },
        result.trade.occurred_at
      )
      const after =
        result.drinks.find((entry) => entry.id === String(drinkId))?.price ??
        result.trade.price
      bookings = [
        {
          id: result.trade.id,
          time: result.trade.occurred_at,
          drink: drinkName,
          qty: result.trade.qty,
          before: result.trade.price,
          after
        },
        ...bookings
      ].slice(0, 12)
      feedback = {
        level: 'success',
        text: interpolate(t.booked, {
          qty: result.trade.qty,
          drink: drinkName,
          before: formatPrice(result.trade.price, $locale),
          after: formatPrice(after, $locale)
        })
      }
    } catch (error) {
      feedback = { level: 'danger', text: errorText(error) }
    } finally {
      pendingDrink = null
    }
  }

  const statusVariant = $derived(
    isLive
      ? 'up'
      : connection.status === 'offline' || connection.status === 'unauthorized'
        ? 'down'
        : 'accent'
  )
</script>

<svelte:head>
  <title>{t.pageTitle} · {$board.bar?.name ?? ''}</title>
</svelte:head>

<div class="space-y-6">
  <header
    class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
  >
    <div class="min-w-0">
      <p class="ui-label">{t.pageTitle}</p>
      <h1 class="mt-1 text-2xl font-semibold tracking-tight">
        {$board.bar?.name ?? ''}
      </h1>
      <p class="mt-1 text-ui-muted">{description}</p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <span role="status" aria-live="polite">
        <Badge variant={statusVariant}
          >{terminal.status[connection.status]}</Badge
        >
      </span>
      <a class="ui-btn" href={resolve('/board/[barId]', { barId: barSlug })}
        >{t.openBoard}</a
      >
      <a class="ui-btn" href={resolve('/admin/[barId]', { barId: barSlug })}
        >{t.openAdmin}</a
      >
    </div>
  </header>

  {#if isStale}
    <Alert level="warning">{t.staleNotice}</Alert>
  {/if}

  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
    <section
      class="rounded-sm border border-ui-line bg-ui-panel"
      aria-labelledby="desk-quotes"
    >
      <div
        class="flex items-center justify-between border-b border-ui-line px-4 py-3 md:px-5"
      >
        <h2 id="desk-quotes" class="ui-label">{t.quotes}</h2>
        <span class="text-xs text-ui-dim">{terminal.changeBasis}</span>
      </div>
      {#if rows.length}
        <ul class="divide-y divide-ui-line">
          {#each rows as row (row.id)}
            <DeskRow
              name={row.name}
              color={row.color}
              price={row.price}
              percent={row.percent}
              direction={row.direction}
              stale={isStale}
              busy={pendingDrink !== null}
              locale={$locale}
              labels={t}
              onBook={(qty) => book(row.id, row.name, qty)}
            />
          {/each}
        </ul>
      {:else}
        <p class="px-5 py-6 text-ui-muted">{$translations.board.card.empty}</p>
      {/if}
    </section>

    <aside class="space-y-4">
      <div aria-live="polite">
        {#if feedback}
          <Alert level={feedback.level}>{feedback.text}</Alert>
        {/if}
      </div>
      <section class="rounded-sm border border-ui-line bg-ui-panel">
        <h2 class="ui-label border-b border-ui-line px-4 py-3">{t.recent}</h2>
        {#if bookings.length}
          <ol class="divide-y divide-ui-line font-mono text-sm">
            {#each bookings as entry (entry.id)}
              <li class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 px-4 py-2">
                <span class="text-ui-dim"
                  >{hydrated
                    ? (formatTime(entry.time, $locale, true) ?? '')
                    : ''}</span
                >
                <span class="truncate font-sans"
                  >{entry.qty}× {entry.drink}</span
                >
                <span></span>
                <span class="text-ui-muted"
                  >{formatPrice(entry.before, $locale)} → {formatPrice(
                    entry.after,
                    $locale
                  )}</span
                >
              </li>
            {/each}
          </ol>
        {:else}
          <p class="px-4 py-4 text-sm text-ui-muted">{t.recentEmpty}</p>
        {/if}
      </section>
    </aside>
  </div>
</div>
