<script lang="ts">
  import { resolve } from '$app/paths'
  import { onMount, untrack } from 'svelte'
  import Alert from '$lib/components/Alert.svelte'
  import Badge from '$lib/components/Badge.svelte'
  import BoardMultiLineChart from '$lib/components/BoardMultiLineChart.svelte'
  import Card from '$lib/components/Card.svelte'
  import DrinkCard from '$lib/components/DrinkCard.svelte'
  import { getI18nContext, interpolate } from '$lib/i18n'
  import {
    createBoardStore,
    type BoardSnapshot,
    type TrendValue
  } from '$lib/stores/board'
  import { seriesColor } from '$lib/utils/chart'
  import { formatCurrency, formatDelta, formatTime } from '$lib/utils/format'
  import {
    createMarketWebSocket,
    FORBIDDEN_CLOSE_CODE
  } from '$lib/utils/ws-client'

  let { snapshot }: { snapshot: BoardSnapshot } = $props()

  const { locale, translations } = getI18nContext()

  // Created once per mounted board; the parent `{#key}` block remounts this
  // component when the bar changes.
  const initialSnapshot = untrack(() => snapshot)
  const board = createBoardStore(initialSnapshot)
  const marketWs = createMarketWebSocket(initialSnapshot.bar.slug)

  // Times are only rendered in the browser to avoid SSR/client time zone
  // mismatches during hydration.
  let hydrated = $state(false)
  let now = $state(Date.now())

  onMount(() => {
    hydrated = true
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
      unsubscribers.forEach((unsubscribe) => unsubscribe())
      marketWs.disconnect()
      board.destroy()
    }
  })

  const connection = $derived($board.connection)
  const isStale = $derived(
    connection.status === 'reconnecting' ||
      connection.status === 'offline' ||
      connection.status === 'unauthorized'
  )

  // Tick once per second only while a retry countdown is visible.
  $effect(() => {
    if (connection.nextRetryAt === null) {
      return
    }
    now = Date.now()
    const interval = setInterval(() => {
      now = Date.now()
    }, 1000)
    return () => clearInterval(interval)
  })

  const retryDetail = $derived.by(() => {
    if (connection.status !== 'reconnecting') {
      return null
    }
    if (connection.nextRetryAt === null) {
      return interpolate($translations.board.connection.reconnectingNow, {
        attempt: connection.attempt
      })
    }
    const seconds = Math.max(
      0,
      Math.ceil((connection.nextRetryAt - now) / 1000)
    )
    return interpolate($translations.board.connection.reconnectingDetail, {
      attempt: connection.attempt,
      seconds
    })
  })

  const showTime = (value: string | null | undefined, withSeconds = false) =>
    (hydrated ? formatTime(value, $locale, withSeconds) : null) ??
    $translations.board.chart.noTimestamp

  const deltaTone = (value: number) => {
    if (value > 0) {
      return 'text-market-primary'
    }
    if (value < 0) {
      return 'text-market-highlight'
    }
    return 'text-white/70'
  }

  const getTrendLabel = (trend: TrendValue) =>
    $translations.board.trendLabels[trend] ?? trend

  const eventTitle = (title: string | null) =>
    title ?? $translations.board.eventOverlay.untitled

  let chartContainerWidth = $state(640)
  const chartWidth = $derived(Math.max(chartContainerWidth, 320))
  const chartHeight = $derived(Math.max(220, Math.round(chartWidth * 0.45)))

  const series = $derived(
    $board.drinks.map((drink, index) => ({
      id: drink.id,
      name: drink.name,
      price: drink.price,
      delta: drink.delta,
      trend: drink.trend,
      history: drink.history,
      color: seriesColor(index)
    }))
  )

  const eventStatusLabel = $derived(
    $board.activeEvent
      ? $board.activeEvent.status === 'ended'
        ? $translations.board.eventOverlay.ended
        : $translations.board.eventOverlay.started
      : $translations.board.eventOverlay.idle
  )
</script>

<svelte:head>
  <title>{$translations.board.pageTitle} · {$board.bar?.name ?? ''}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex">
    <a
      href={resolve('/dashboard/[barId]', {
        barId: initialSnapshot.bar.slug
      })}
      class="flex items-center gap-2 rounded-2xl border border-white/20 px-3 py-2 text-xs font-semibold tracking-[0.35em] text-white/70 uppercase transition hover:border-market-accent/70"
    >
      <span aria-hidden="true">←</span>
      <span>{$translations.board.backButton}</span>
    </a>
  </div>

  <div role="status" aria-live="polite">
    {#if connection.status === 'unauthorized'}
      <Alert level="danger">
        <p class="text-sm">
          {connection.closeCode === FORBIDDEN_CLOSE_CODE
            ? $translations.board.connection.forbidden
            : $translations.board.connection.unauthenticated}
        </p>
        <!-- eslint-disable svelte/no-navigation-without-resolve -- resolved route plus a query string -->
        <a
          class="mt-2 inline-block text-xs font-semibold tracking-[0.3em] uppercase underline"
          href={`${resolve('/login')}?from=protected`}
        >
          {$translations.board.connection.loginLink}
        </a>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
      </Alert>
    {:else if connection.status === 'offline'}
      <Alert level="warning">
        <p class="text-sm">{$translations.board.connection.offlineDetail}</p>
        <p class="mt-1 text-xs">
          {interpolate($translations.board.connection.lastUpdate, {
            time: showTime($board.lastUpdated, true)
          })}
        </p>
      </Alert>
    {:else if connection.status === 'reconnecting'}
      <Alert level="warning">
        <p class="text-sm">{$translations.board.connection.staleNotice}</p>
        <p class="mt-1 text-xs">
          {interpolate($translations.board.connection.lastUpdate, {
            time: showTime($board.lastUpdated, true)
          })}
          {#if retryDetail}
            · {retryDetail}
          {/if}
        </p>
      </Alert>
    {/if}
  </div>

  {#if $board.activeEvent}
    <section
      class="rounded-2xl border-l-4 border-market-primary/70 bg-white/5 px-6 py-4"
    >
      <div
        class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <Badge
            variant={$board.activeEvent.status === 'ended'
              ? 'muted'
              : 'success'}>{$translations.board.eventOverlay.live}</Badge
          >
          <p class="mt-2 text-lg font-semibold text-white">
            {eventTitle($board.activeEvent.title)}
          </p>
          {#if $board.activeEvent.description}
            <p class="text-sm text-white/70">
              {$board.activeEvent.description}
            </p>
          {/if}
        </div>
        <p class="text-xs tracking-[0.4em] text-white/60 uppercase">
          {eventStatusLabel}
        </p>
      </div>
    </section>
  {:else}
    <section class="rounded-2xl border border-white/10 bg-white/5 px-6 py-6">
      <p class="text-sm text-white/60">
        {$translations.board.eventOverlay.idle}
      </p>
    </section>
  {/if}

  <section
    class="rounded-3xl border border-white/10 bg-linear-to-b from-market-surface/90 to-market-surface/40 px-6 py-6"
  >
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
      <div class="space-y-6">
        <div
          class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p class="text-xs tracking-[0.4em] text-white/60 uppercase">
              {$translations.board.header.kicker}
            </p>
            <p class="text-4xl font-semibold text-white">
              {$translations.board.header.title}
            </p>
            <p class="text-sm text-white/70">
              {$translations.board.ticker.subTitle}
            </p>
            {#if $board.bar}
              <p class="text-sm text-white/50">{$board.bar.name}</p>
            {/if}
          </div>
          <div class="flex flex-col items-end gap-2">
            <div class="flex items-center gap-2">
              {#if connection.status === 'connected'}
                <Badge variant="accent">{$translations.board.badges.live}</Badge
                >
              {/if}
              <Badge variant={isStale ? 'warning' : 'muted'}>
                {$translations.board.connectionStatus[connection.status]}
              </Badge>
            </div>
            <button
              type="button"
              class="rounded-full border border-white/20 px-4 py-1 text-xs tracking-[0.4em] text-white/70 uppercase transition hover:border-market-primary/80"
              onclick={() => marketWs.reconnect()}
            >
              {$translations.board.actions.reconnect}
            </button>
          </div>
        </div>
        <div
          class="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/80"
        >
          {#if series.length}
            <div class="flex items-center justify-between">
              <p
                class="text-[0.65rem] tracking-[0.4em] text-white/50 uppercase"
              >
                {$translations.board.ticker.label}
              </p>
              <Badge variant="muted">
                {series.length}
              </Badge>
            </div>
            <div class="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {#each series as drink (drink.id)}
                <DrinkCard
                  name={drink.name}
                  priceLabel={formatCurrency(drink.price, $locale)}
                  deltaLabel={formatDelta(drink.delta, $locale)}
                  trendLabel={getTrendLabel(drink.trend)}
                  deltaTone={deltaTone(drink.delta)}
                  stale={isStale}
                />
              {/each}
            </div>
          {:else}
            <p class="text-sm text-white/60">
              {$translations.board.card.empty}
            </p>
          {/if}
        </div>
      </div>
      <Card>
        <div class="flex flex-col gap-6">
          <header
            class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p class="text-xs tracking-[0.4em] text-white/50 uppercase">
                {$translations.board.chart.sectionTitle}
              </p>
              <p class="text-2xl font-semibold text-white">
                {$translations.board.chart.subTitle}
              </p>
            </div>
            <Badge variant="muted">{$translations.board.chart.chartBadge}</Badge
            >
          </header>
          <div
            class={`min-h-[240px] overflow-hidden rounded-2xl border border-white/10 bg-market-surface/70 p-3 transition-opacity ${isStale ? 'opacity-50' : ''}`}
            bind:clientWidth={chartContainerWidth}
          >
            {#if series.length}
              <BoardMultiLineChart
                {series}
                width={chartWidth}
                height={chartHeight}
                label={$translations.board.chart.ariaLabel}
              />
            {:else}
              <p class="text-sm text-white/60">
                {$translations.board.card.empty}
              </p>
            {/if}
          </div>
          <div>
            <p class="text-xs tracking-[0.4em] text-white/50 uppercase">
              {$translations.board.chart.legendTitle}
            </p>
            <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {#each series as entry (entry.id)}
                <div
                  class={`flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition-opacity ${isStale ? 'opacity-50' : ''}`}
                >
                  <div class="flex items-center gap-3">
                    <span
                      class="inline-flex h-3 w-3 rounded-full"
                      style:background={entry.color}
                    ></span>
                    <div>
                      <p class="text-white">{entry.name}</p>
                      <p
                        class="text-xs tracking-[0.3em] text-white/60 uppercase"
                      >
                        {formatCurrency(entry.price, $locale)} · {getTrendLabel(
                          entry.trend
                        )}
                      </p>
                    </div>
                  </div>
                  <p class={`text-xs font-semibold ${deltaTone(entry.delta)}`}>
                    {formatDelta(entry.delta, $locale)}
                  </p>
                </div>
              {:else}
                <p class="text-sm text-white/60">
                  {$translations.board.card.empty}
                </p>
              {/each}
            </div>
          </div>
        </div>
      </Card>
    </div>
    <p class="mt-3 text-xs tracking-[0.4em] text-white/40 uppercase">
      {$translations.board.chart.lastUpdated}: {showTime($board.lastUpdated)}
    </p>
  </section>

  <section class="space-y-3">
    <div class="flex items-center justify-between">
      <p class="text-xs tracking-[0.4em] text-white/50 uppercase">
        {$translations.board.eventFeed.title}
      </p>
      <p class="text-xs text-white/40">{$board.eventFeed.length}</p>
    </div>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each $board.eventFeed as event (event.id)}
        <Card>
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-semibold text-white">
              {eventTitle(event.title)}
            </p>
            <Badge variant={event.status === 'ended' ? 'muted' : 'success'}>
              {event.status === 'ended'
                ? $translations.board.eventOverlay.ended
                : $translations.board.eventOverlay.started}
            </Badge>
          </div>
          {#if event.description}
            <p class="text-sm text-white/70">{event.description}</p>
          {/if}
          <p class="text-xs tracking-[0.4em] text-white/50 uppercase">
            {showTime(event.timestamp)}
          </p>
        </Card>
      {:else}
        <Card>
          <p class="text-sm text-white/60">
            {$translations.board.eventFeed.empty}
          </p>
        </Card>
      {/each}
    </div>
  </section>

  <Alert level="info">
    <p class="text-sm text-white/80">
      {$translations.board.alert.prefix}
      <strong>{$translations.board.alert.eventChannel}</strong>
      {$translations.board.alert.middle}
      <strong>{$translations.board.alert.priceChannel}</strong>
      {$translations.board.alert.suffix}
    </p>
  </Alert>
</div>
