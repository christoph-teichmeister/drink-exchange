<script lang="ts">
  import { Card } from '$lib/components';
  import Alert from '$lib/components/Alert.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import { translations } from '$lib/i18n';
</script>

<svelte:head>
  <title>{$translations.home.pageTitle}</title>
  <meta name="description" content={$translations.home.description} />
</svelte:head>

<div class="space-y-6">
  <Card title={$translations.home.quickStart.title} description={$translations.home.quickStart.description}>
    <p class="text-sm text-white/70">
      {$translations.home.quickStart.body}
      <Badge variant="muted">{$translations.home.quickStart.badge}</Badge>
    </p>
  </Card>
  <Alert level="info">
    <p class="text-white/80 text-sm">{$translations.home.alert}</p>
  </Alert>
</div>
