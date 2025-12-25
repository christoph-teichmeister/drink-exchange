<script lang="ts">
  import { Card } from '$lib/components';
  import Table from '$lib/components/Table.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import { onMount } from 'svelte';
  import { translations } from '$lib/i18n';

  let modalOpen = false;
  const openModal = () => (modalOpen = true);
  const closeModal = () => (modalOpen = false);

  onMount(() => {
    // stubbed admin-specific bootstrapping
  });
</script>

<svelte:head>
  <title>{$translations.admin.pageTitle}</title>
</svelte:head>

<div class="space-y-6">
  <Card title={$translations.admin.cardTitle} description={$translations.admin.cardDescription}>
    <div class="flex flex-wrap items-center gap-4">
      <Badge variant="accent">{$translations.admin.badges.operations}</Badge>
      <Badge variant="warning">{$translations.admin.badges.watch}</Badge>
      <button
        class="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/70 hover:border-market-accent/80"
        on:click={openModal}
      >
        {$translations.admin.buttonSchedule}
      </button>
    </div>
  </Card>
  <Card>
    <Table>
      <thead>
        <tr class="text-left text-xs uppercase tracking-[0.3em] text-white/60">
          <th class="pb-2">{$translations.admin.tableHeaders.job}</th>
          <th class="pb-2">{$translations.admin.tableHeaders.status}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5 text-sm text-white/80">
        {#each $translations.admin.operations as job}
          <tr>
            <td class="py-3 pr-4">{job.name}</td>
            <td class="py-3">{job.status}</td>
          </tr>
        {/each}
      </tbody>
    </Table>
  </Card>
  <div class="grid gap-4 md:grid-cols-2">
    {#each $translations.admin.upcoming as event}
      <Card>
        <p class="text-lg font-semibold text-white">{event.title}</p>
        <p class="text-sm text-white/70">{event.info}</p>
      </Card>
    {/each}
  </div>
</div>

<Modal title={$translations.admin.modal.title} size="md" open={modalOpen} on:close={closeModal}>
  <p class="text-sm text-white/70">{$translations.admin.modal.body}</p>
  <button
    class="mt-2 rounded-full bg-market-accent/90 px-4 py-2 text-xs uppercase tracking-[0.4em] text-market-surface"
    on:click={closeModal}
  >
    {$translations.admin.modal.confirm}
  </button>
</Modal>
