<script lang="ts">
  import { Card } from '$lib/components';
  import Table from '$lib/components/Table.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import Alert from '$lib/components/Alert.svelte';

  const portfolio = [
    { label: 'Barrel ETF', progress: '42%' },
    { label: 'Lager Basket', progress: '68%' },
    { label: 'Mixology Blend', progress: '31%' }
  ];

  const announcements = [
    { title: 'Live Update', body: 'Orders warten auf Freigabe.' },
    { title: 'Neue Preise', body: 'Heute gibt es 5% Rabatt auf Premium-Mix.' }
  ];
</script>

<svelte:head>
  <title>User Experience</title>
</svelte:head>

<div class="space-y-6">
  <Card title="User Portal" description="Kunden-Dashboard">
    <Table>
      <thead>
        <tr class="text-left text-xs uppercase tracking-[0.3em] text-white/60">
          <th class="pb-2">Signal</th>
          <th class="pb-2">Status</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5 text-sm">
        {#each portfolio as item}
          <tr>
            <td class="py-2 pr-4 text-white">{item.label}</td>
            <td class="py-2 text-white/70">{item.progress}</td>
          </tr>
        {/each}
      </tbody>
    </Table>
  </Card>
  <Alert level="info">
    <p class="text-sm text-white/80">
      <Badge variant="accent">Hinweis</Badge> Die Preise werden live über das Big Screen-Konzept aktualisiert.
    </p>
  </Alert>
  <div class="grid gap-4 md:grid-cols-2">
    {#each announcements as note}
      <Card accent={false}>
        <p class="text-lg font-semibold text-white">{note.title}</p>
        <p class="text-sm text-white/70">{note.body}</p>
      </Card>
    {/each}
  </div>
</div>
