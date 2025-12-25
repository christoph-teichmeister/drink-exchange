<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import Alert from '$lib/components/Alert.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import Table from '$lib/components/Table.svelte';
  import Card from '$lib/components/Card.svelte';
  import { createMarketWebSocket } from '$lib/utils/ws-client';

  const barId = 'main-stage';
  const marketWs = createMarketWebSocket(barId);

  let connectionStatus = 'verbindet...';
  let rates = [
    { id: 'Barrel Index', price: '€23.12' },
    { id: 'Lager Index', price: '€18.41' },
    { id: 'Mixology Index', price: '€31.67' }
  ];
  let events: { title: string; description: string }[] = [];

  const priceHandler = (payload: { rates?: { id: string; price: string }[] }) => {
    if (payload.rates) {
      rates = payload.rates;
      connectionStatus = 'verbunden';
    }
  };
  const eventHandler = (payload: { event?: { title: string; description: string } }) => {
    if (payload.event) {
      events = [payload.event, ...events].slice(0, 4);
    }
  };

  onMount(() => {
    marketWs.connect();
    marketWs.on('prices.update', priceHandler);
    marketWs.on('event.*', eventHandler);

    return () => {
      marketWs.off('prices.update', priceHandler);
      marketWs.off('event.*', eventHandler);
      marketWs.disconnect();
    };
  });
</script>

<svelte:head>
  <title>Board View</title>
</svelte:head>

<div class="space-y-6 rounded-3xl border border-market-accent/30 px-6 py-6 board-shell">
  <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
    <div>
      <p class="text-xs uppercase tracking-[0.4em] text-white/60">High Contrast Board</p>
      <p class="text-4xl font-bold text-white">Ticker &amp; Event Command</p>
    </div>
    <div class="flex items-center gap-4">
      <Badge variant="accent">live</Badge>
      <Badge variant="muted">{connectionStatus}</Badge>
    </div>
  </div>
  <div class="chart-skeleton px-4 py-6">
    <div class="ticker-line text-2xl">
      {#each rates as rate, index}
        <span class="mr-6 inline-block text-lg font-semibold">
          {rate.id}: {rate.price}
        </span>
      {/each}
    </div>
    <div class="mt-8 grid gap-4 text-sm text-white/60 sm:grid-cols-2">
      {#each rates as rate}
        <div>
          <p class="text-lg font-semibold text-white">{rate.price}</p>
          <p class="text-xs uppercase tracking-[0.35em] text-white/40">{rate.id}</p>
        </div>
      {/each}
    </div>
  </div>
  <Card>
    <div class="flex flex-col gap-6">
      <div class="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.3em] text-white/60">
        <span>Prices</span>
        <button class="rounded-full border border-white/20 px-4 py-1 text-white/70 hover:border-market-accent/80" on:click={marketWs.reconnect}>
          Neustart
        </button>
      </div>
      <Table>
        <thead>
          <tr class="text-left text-[0.55rem] uppercase tracking-[0.4em] text-white/40">
            <th class="pb-2">Metrik</th>
            <th class="pb-2">Wert</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5 text-base">
          {#each rates as rate}
            <tr>
              <td class="py-3 text-white/80">{rate.id}</td>
              <td class="py-3 font-semibold text-white">{rate.price}</td>
            </tr>
          {/each}
        </tbody>
      </Table>
    </div>
  </Card>
  <div class="grid gap-4 md:grid-cols-2">
    {#if events.length}
      {#each events as event}
        <Card>
          <p class="text-base font-semibold text-white">{event.title}</p>
          <p class="text-sm text-white/70">{event.description}</p>
        </Card>
      {/each}
    {:else}
      <Card>
        <p class="text-sm text-white/60">Warten auf das nächste Event...</p>
      </Card>
    {/if}
  </div>
  <Alert level="info">
    <p class="text-sm text-white/80">Events und Preise werden über <strong>event.*</strong> und <strong>prices.update</strong> gesteuert.</p>
  </Alert>
</div>
