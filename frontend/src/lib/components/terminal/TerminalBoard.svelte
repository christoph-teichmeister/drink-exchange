<script lang="ts">
  import { resolve } from '$app/paths'
  import { onMount, untrack } from 'svelte'
  import EventPanel from '$lib/components/terminal/EventPanel.svelte'
  import PriceChart from '$lib/components/terminal/PriceChart.svelte'
  import QuoteTable, {
    type QuoteRow
  } from '$lib/components/terminal/QuoteTable.svelte'
  import TickerTape from '$lib/components/terminal/TickerTape.svelte'
  import { getI18nContext, interpolate } from '$lib/i18n'
  import { createBoardStore, type BoardSnapshot } from '$lib/stores/board'
  import { seriesColor } from '$lib/utils/chart'
  import { formatTime } from '$lib/utils/format'
  import { changeFromBase, directionOf, lastMove } from '$lib/utils/market'
  import {
    createMarketWebSocket,
    FORBIDDEN_CLOSE_CODE
  } from '$lib/utils/ws-client'

  let { snapshot }: { snapshot: BoardSnapshot } = $props()

  const { locale, translations } = getI18nContext()
  const t = $derived($translations.board.terminal)

  // Created once per mounted board; the parent `{#key}` block remounts this
  // component when the bar changes.
  const initialSnapshot = untrack(() => snapshot)
  const board = createBoardStore(initialSnapshot)
  const marketWs = createMarketWebSocket(initialSnapshot.bar.slug)

  // Clock and countdowns are only rendered in the browser to avoid SSR/client
  // time zone mismatches during hydration.
  let hydrated = $state(false)
  let now = $state(Date.now())
  let isFullscreen = $state(false)

  onMount(() => {
    hydrated = true
    const clock = setInterval(() => {
      now = Date.now()
    }, 1000)
    const onFullscreenChange = () => {
      isFullscreen = document.fullscreenElement !== null
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)

    const unsubscribers = [
      marketWs.onStatus((connection) => board.setConnection(connection)),
      marketWs.on('prices.update', (payload, frame) =>
        board.applyPriceUpdate(payload, frame.timestamp)
      ),
      marketWs.on('event.started', (payload, frame) =>
        board.applyEvent('event.started', payload, frame.timestamp)
      ),
      marketWs.on('event.ended', (payload, frame) =>
        board.applyEvent('event.ended', payload, frame.timestamp)
      )
    ]
    marketWs.connect()

    return () => {
      clearInterval(clock)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      unsubscribers.forEach((unsubscribe) => unsubscribe())
      marketWs.disconnect()
      board.destroy()
    }
  })

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch (error) {
      console.error('Fullscreen toggle failed', error)
    }
  }

  const connection = $derived($board.connection)
  const isLive = $derived(connection.status === 'connected')
  const isStale = $derived(
    connection.status === 'reconnecting' ||
      connection.status === 'offline' ||
      connection.status === 'unauthorized'
  )

  const retrySeconds = $derived(
    connection.status === 'reconnecting' && connection.nextRetryAt !== null
      ? Math.max(0, Math.ceil((connection.nextRetryAt - now) / 1000))
      : null
  )

  const rows: QuoteRow[] = $derived(
    $board.drinks.map((drink, index) => {
      const change = changeFromBase(drink.price, drink.base_price)
      return {
        id: drink.id,
        name: drink.name,
        color: seriesColor(index),
        price: drink.price,
        change: change?.absolute ?? null,
        percent: change?.percent ?? null,
        direction: change ? directionOf(change.absolute) : drink.trend,
        lastMove: lastMove(drink.history),
        history: drink.history
      }
    })
  )

  const series = $derived(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      history: row.history,
      color: row.color
    }))
  )

  const clock = $derived(
    hydrated ? formatTime(new Date(now).toISOString(), $locale, true) : null
  )
  const lastUpdate = $derived(
    hydrated ? formatTime($board.lastUpdated, $locale, true) : null
  )

  const statusTone = $derived(
    isLive
      ? 'text-term-up'
      : connection.status === 'unauthorized' || connection.status === 'offline'
        ? 'text-term-down'
        : 'text-term-amber'
  )
</script>

<svelte:head>
  <title>{$board.bar?.name ?? ''} · {t.brand}</title>
</svelte:head>

<div
  class="terminal flex min-h-dvh flex-col lg:h-dvh lg:min-h-0 lg:overflow-hidden"
>
  <header
    class="flex items-center justify-between gap-6 border-b border-term-line px-[clamp(1rem,1.6vw,2rem)] py-[clamp(0.5rem,1.2vh,1rem)]"
  >
    <div class="flex min-w-0 items-baseline gap-4">
      <span
        class="hidden font-mono text-[clamp(0.7rem,0.8vw,1rem)] font-semibold tracking-wider whitespace-nowrap text-term-amber uppercase sm:inline"
        >{t.brand}</span
      >
      <h1
        class="truncate text-[clamp(1.1rem,1.7vw,2.25rem)] font-semibold tracking-tight"
      >
        {$board.bar?.name ?? ''}
      </h1>
    </div>

    <div class="flex items-center gap-[clamp(1rem,2vw,2.5rem)]">
      <div
        class="flex items-center gap-3 font-mono text-[clamp(0.75rem,0.9vw,1.1rem)] uppercase"
        role="status"
        aria-live="polite"
      >
        <span
          class={`h-[0.6em] w-[0.6em] rounded-full bg-current ${statusTone} ${isLive ? 'term-blink' : ''}`}
          aria-hidden="true"
        ></span>
        <span class={statusTone}>{t.status[connection.status]}</span>
        {#if retrySeconds !== null}
          <span class="text-term-muted normal-case"
            >{interpolate(t.retryIn, { seconds: retrySeconds })}</span
          >
        {/if}
        {#if isStale}
          <span class="border border-term-amber px-1.5 text-term-amber"
            >{t.stale}</span
          >
        {/if}
      </div>
      <span
        class="font-mono text-[clamp(1.1rem,1.7vw,2.25rem)] font-semibold whitespace-nowrap tabular-nums"
        >{clock ?? '--:--:--'}</span
      >
    </div>
  </header>

  {#if connection.status === 'unauthorized'}
    <div
      class="flex flex-wrap items-center gap-4 border-b border-term-line bg-term-panel px-[clamp(1rem,1.6vw,2rem)] py-3 text-term-down"
      role="alert"
    >
      <span>
        {connection.closeCode === FORBIDDEN_CLOSE_CODE
          ? $translations.board.connection.forbidden
          : $translations.board.connection.unauthenticated}
      </span>
      <!-- eslint-disable svelte/no-navigation-without-resolve -- resolved route plus a query string -->
      <a
        class="underline underline-offset-4"
        href={`${resolve('/login')}?from=protected`}
        >{$translations.board.connection.loginLink}</a
      >
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </div>
  {/if}

  <TickerTape
    items={rows.map((row) => ({
      id: row.id,
      name: row.name,
      price: row.price,
      percent: row.percent,
      direction: row.direction
    }))}
    locale={$locale}
    label={t.tape}
    stale={isStale}
  />

  <main
    class="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"
  >
    <section
      class="flex min-h-0 flex-col border-term-line lg:border-r"
      aria-label={t.quotes}
    >
      <QuoteTable
        {rows}
        locale={$locale}
        labels={t.columns}
        stale={isStale}
        emptyLabel={$translations.board.card.empty}
      />
    </section>

    <div
      class="grid min-h-0 grid-rows-[minmax(14rem,1.1fr)_auto] lg:grid-rows-[minmax(0,1.1fr)_minmax(0,1fr)]"
    >
      <section class="flex min-h-0 flex-col border-b border-term-line">
        <h2
          class="border-b border-term-line px-[clamp(1rem,1.6vw,2rem)] py-2 text-[clamp(0.65rem,0.75vw,0.9rem)] font-medium tracking-wider text-term-muted uppercase"
        >
          {t.chart}
        </h2>
        <div class="min-h-0 flex-1 px-[clamp(1rem,1.6vw,2rem)] py-3">
          <PriceChart
            {series}
            locale={$locale}
            label={$translations.board.chart.ariaLabel}
            showTimes={hydrated}
            stale={isStale}
          />
        </div>
      </section>
      <EventPanel
        activeEvent={$board.activeEvent}
        feed={$board.eventFeed}
        {now}
        locale={$locale}
        labels={t}
        untitled={$translations.board.eventOverlay.untitled}
        {hydrated}
      />
    </div>
  </main>

  <footer
    class="flex flex-wrap items-center justify-between gap-4 border-t border-term-line px-[clamp(1rem,1.6vw,2rem)] py-2 font-mono text-[clamp(0.65rem,0.75vw,0.9rem)] text-term-muted"
  >
    <span>
      {interpolate(t.lastUpdate, { time: lastUpdate ?? '--:--:--' })} · {t.changeBasis}
    </span>
    <nav class="flex items-center gap-5 uppercase">
      {#if !isLive}
        <button
          type="button"
          class="uppercase hover:text-term-text focus-visible:text-term-text"
          onclick={() => marketWs.reconnect()}>{t.reconnect}</button
        >
      {/if}
      <button
        type="button"
        class="uppercase hover:text-term-text focus-visible:text-term-text"
        onclick={toggleFullscreen}
        >{isFullscreen ? t.exitFullscreen : t.fullscreen}</button
      >
      <a
        class="uppercase hover:text-term-text focus-visible:text-term-text"
        href={resolve('/dashboard/[barId]', {
          barId: initialSnapshot.bar.slug
        })}>{t.exit}</a
      >
    </nav>
  </footer>
</div>
