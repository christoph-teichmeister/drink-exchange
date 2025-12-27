<script lang="ts">
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import Alert from '$lib/components/Alert.svelte'
  import Badge from '$lib/components/Badge.svelte'
  import Card from '$lib/components/Card.svelte'
  import BoardLineChart from '$lib/components/BoardLineChart.svelte'
  import { translations } from '$lib/i18n'
  import { createMarketWebSocket, type MarketPayload } from '$lib/utils/ws-client'
  import { createBoardStore } from '$lib/stores/board'
  import type { PageData } from './$types'

  export let data: PageData

  const boardStore = createBoardStore(data.snapshot)
  let boardState = get(boardStore)
  const unsubscribe = boardStore.subscribe((value) => {
    boardState = value
  })

  const marketWs = createMarketWebSocket(data.snapshot.bar.slug)

  const handleWsOpen = () => boardStore.setConnectionStatus('connected')
  const handleWsClose = () => boardStore.setConnectionStatus('reconnecting')
  const handlePrices = (payload: MarketPayload) => {
    boardStore.applyPriceUpdate(payload)
  }
  const handleEvent = (payload: MarketPayload & { type?: string }) => {
    boardStore.queueEvent(payload.type ?? '', payload)
  }

  const reconnect = () => {
    boardStore.setConnectionStatus('connecting')
    marketWs.reconnect()
  }

  onMount(() => {
    boardStore.setConnectionStatus('connecting')
    marketWs.on('ws.open', handleWsOpen)
    marketWs.on('ws.close', handleWsClose)
    marketWs.on('prices.update', handlePrices)
    marketWs.on('event.*', handleEvent)
    marketWs.connect()

    return () => {
      marketWs.off('ws.open', handleWsOpen)
      marketWs.off('ws.close', handleWsClose)
      marketWs.off('prices.update', handlePrices)
      marketWs.off('event.*', handleEvent)
      marketWs.disconnect()
      unsubscribe()
      boardStore.destroy()
    }
  })

  const formatCurrency = (value: number | null | undefined) => {
    const price = Number.isFinite(Number(value)) ? Number(value) : 0
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2
    }).format(price)
  }

  const formatDelta = (value: number | null | undefined) => {
    const delta = Number.isFinite(Number(value)) ? Number(value) : 0
    return `${delta > 0 ? '+' : ''}${delta.toFixed(2)}`
  }

  const deltaTone = (value: number | null | undefined) => {
    if (Number(value) > 0) {
      return 'text-market-primary'
    }
    if (Number(value) < 0) {
      return 'text-market-highlight'
    }
    return 'text-white/70'
  }

  const formatTimestamp = (value?: string | null) => {
    if (!value) {
      return $translations.board.chart.noTimestamp
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getTrendLabel = (trend: string) => {
    const lookupKey = trend as keyof typeof $translations.board.trendLabels
    return $translations.board.trendLabels[lookupKey] ?? trend
  }

  $: connectionLabel = $translations.board.connectionStatus[boardState.connection]
  $: eventStatusLabel = boardState.activeEvent
    ? boardState.activeEvent.status === 'ended'
      ? $translations.board.eventOverlay.ended
      : $translations.board.eventOverlay.started
    : $translations.board.eventOverlay.idle
  $: eventBadgeVariant = boardState.activeEvent?.status === 'ended' ? 'muted' : 'success'
</script>

<svelte:head>
  <title>{$translations.board.pageTitle} · {boardState.bar?.name ?? ''}</title>
</svelte:head>

<div class="space-y-6">
  {#if boardState.activeEvent}
    <section class="rounded-2xl border-l-4 border-market-primary/70 bg-white/5 px-6 py-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge variant={eventBadgeVariant}>{$translations.board.eventOverlay.live}</Badge>
          <p class="mt-2 text-lg font-semibold text-white">{boardState.activeEvent.title}</p>
          <p class="text-sm text-white/70">{boardState.activeEvent.description}</p>
        </div>
        <p class="text-xs uppercase tracking-[0.4em] text-white/60">{eventStatusLabel}</p>
      </div>
    </section>
  {:else}
    <section class="rounded-2xl border border-white/10 bg-white/5 px-6 py-6">
      <p class="text-sm text-white/60">{$translations.board.eventOverlay.idle}</p>
    </section>
  {/if}

  <section class="rounded-3xl border border-white/10 bg-gradient-to-b from-market-surface/90 to-market-surface/40 px-6 py-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.4em] text-white/60">{$translations.board.header.kicker}</p>
        <p class="text-4xl font-semibold text-white">{$translations.board.header.title}</p>
        <p class="text-sm text-white/70">{$translations.board.ticker.subTitle}</p>
        {#if boardState.bar}
          <p class="text-sm text-white/50">{boardState.bar.name}</p>
        {/if}
      </div>
      <div class="flex flex-col items-end gap-2">
        <div class="flex items-center gap-2">
          <Badge variant="accent">{$translations.board.badges.live}</Badge>
          <Badge variant="muted">{connectionLabel}</Badge>
        </div>
        <button
          class="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/70 transition hover:border-market-primary/80"
          on:click={reconnect}
        >
          {$translations.board.actions.reconnect}
        </button>
      </div>
    </div>
    <div class="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-white/80">
      {#if boardState.drinks.length}
        <p class="text-[0.65rem] uppercase tracking-[0.4em] text-white/50">
          {$translations.board.ticker.label}
        </p>
        <div class="flex flex-wrap gap-6 overflow-x-auto">
          {#each boardState.drinks as drink}
            <div class="min-w-[140px] text-sm">
              <p class="text-xs uppercase tracking-[0.3em] text-white/40">{drink.name}</p>
              <p class="text-2xl font-semibold text-white">{formatCurrency(drink.price)}</p>
              <p class={`text-sm font-semibold ${deltaTone(drink.delta)}`}>
                {formatDelta(drink.delta)} · {getTrendLabel(drink.trend)}
              </p>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-sm text-white/60">{$translations.board.card.empty}</p>
      {/if}
    </div>
    <p class="mt-3 text-xs uppercase tracking-[0.4em] text-white/40">
      {$translations.board.chart.lastUpdated}: {formatTimestamp(boardState.lastUpdated)}
    </p>
  </section>

  <div class="grid gap-4 md:grid-cols-2">
    {#if boardState.drinks.length}
      {#each boardState.drinks as drink}
        <Card class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs uppercase tracking-[0.4em] text-white/50">{drink.name}</p>
              <p class="text-3xl font-semibold text-white">{formatCurrency(drink.price)}</p>
            </div>
            <div class="text-right text-xs uppercase tracking-[0.4em] text-white/40">
              <p class={`text-lg font-semibold ${deltaTone(drink.delta)}`}>
                {formatDelta(drink.delta)}
              </p>
              <p>{getTrendLabel(drink.trend)}</p>
            </div>
          </div>
          <div class="h-40">
            <BoardLineChart history={drink.history} />
          </div>
          <div class="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.4em] text-white/50">
            <span>{$translations.board.card.priceLabel}</span>
            <span>{$translations.board.card.deltaLabel}</span>
          </div>
        </Card>
      {/each}
    {:else}
      <Card>
        <p class="text-sm text-white/60">{$translations.board.card.empty}</p>
      </Card>
    {/if}
  </div>

  <section class="space-y-3">
    <div class="flex items-center justify-between">
      <p class="text-xs uppercase tracking-[0.4em] text-white/50">{$translations.board.eventFeed.title}</p>
      <p class="text-xs text-white/40">{boardState.eventFeed.length}</p>
    </div>
    <div class="grid gap-4 md:grid-cols-3">
      {#if boardState.eventFeed.length}
        {#each boardState.eventFeed as event}
          <Card>
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-semibold text-white">{event.title}</p>
              <Badge variant={event.status === 'ended' ? 'muted' : 'success'}>
                {event.status === 'ended'
                  ? $translations.board.eventOverlay.ended
                  : $translations.board.eventOverlay.started}
              </Badge>
            </div>
            <p class="text-sm text-white/70">{event.description}</p>
            <p class="text-xs uppercase tracking-[0.4em] text-white/50">{formatTimestamp(event.timestamp)}</p>
          </Card>
        {/each}
      {:else}
        <Card>
          <p class="text-sm text-white/60">{$translations.board.eventFeed.empty}</p>
        </Card>
      {/if}
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
