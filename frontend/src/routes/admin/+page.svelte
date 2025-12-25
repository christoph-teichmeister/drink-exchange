<script lang="ts">
  import { Card } from '$lib/components';
  import Table from '$lib/components/Table.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import { onMount } from 'svelte';

  let modalOpen = false;
  const operations = [
    { id: 'anime', name: 'Automatisierte Bar', status: 'Healthy' },
    { id: 'ledger', name: 'Ledger Jobs', status: 'Pending' },
    { id: 'audit', name: 'Audit Queue', status: 'Delayed' }
  ];

  const openModal = () => (modalOpen = true);
  const closeModal = () => (modalOpen = false);

  let upcoming = [
    { title: 'Health Check', info: 'In 4 minutes' },
    { title: 'Batch Settlements', info: 'In 12 minutes' }
  ];

  onMount(() => {
    // stubbed admin-specific bootstrapping
  });
</script>

<svelte:head>
  <title>Admin Cockpit</title>
</svelte:head>

<div class="space-y-6">
  <Card title="Admin Cockpit" description="Steuere alle Wall Street Drinks">
    <div class="flex flex-wrap items-center gap-4">
      <Badge variant="accent">Operations</Badge>
      <Badge variant="warning">Watch</Badge>
      <button class="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/70 hover:border-market-accent/80" on:click={openModal}>
        Ereignis planen
      </button>
    </div>
  </Card>
  <Card>
    <Table>
      <thead>
        <tr class="text-left text-xs uppercase tracking-[0.3em] text-white/60">
          <th class="pb-2">Job</th>
          <th class="pb-2">Status</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5 text-sm text-white/80">
        {#each operations as job}
          <tr>
            <td class="py-3 pr-4">{job.name}</td>
            <td class="py-3">{job.status}</td>
          </tr>
        {/each}
      </tbody>
    </Table>
  </Card>
  <div class="grid gap-4 md:grid-cols-2">
    {#each upcoming as event}
      <Card>
        <p class="text-lg font-semibold text-white">{event.title}</p>
        <p class="text-sm text-white/70">{event.info}</p>
      </Card>
    {/each}
  </div>
</div>

<Modal title="Ereignis planen" size="md" open={modalOpen} on:close={closeModal}>
  <p class="text-sm text-white/70">Live Events erscheinen automatisch auf dem Big Screen.</p>
  <button class="mt-2 rounded-full bg-market-accent/90 px-4 py-2 text-xs uppercase tracking-[0.4em] text-market-surface" on:click={closeModal}>
    Bestätigen
  </button>
</Modal>
