<script lang="ts">
  import { Card } from '$lib/components';
  import Table from '$lib/components/Table.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import Alert from '$lib/components/Alert.svelte';
  import { translations } from '$lib/i18n';
</script>

<svelte:head>
  <title>{$translations.user.pageTitle}</title>
</svelte:head>

<div class="space-y-6">
  <Card title={$translations.user.cardTitle} description={$translations.user.cardDescription}>
    <Table>
      <thead>
        <tr class="text-left text-xs uppercase tracking-[0.3em] text-white/60">
          <th class="pb-2">{$translations.user.tableHeaders.signal}</th>
          <th class="pb-2">{$translations.user.tableHeaders.status}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5 text-sm">
        {#each $translations.user.portfolio as item}
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
      <Badge variant="accent">{$translations.user.alert.badge}</Badge> {$translations.user.alert.message}
    </p>
  </Alert>
  <div class="grid gap-4 md:grid-cols-2">
    {#each $translations.user.announcements as note}
      <Card accent={false}>
        <p class="text-lg font-semibold text-white">{note.title}</p>
        <p class="text-sm text-white/70">{note.body}</p>
      </Card>
    {/each}
  </div>
</div>
