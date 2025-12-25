<script lang="ts">
  import { Card } from '$lib/components';
  import Alert from '$lib/components/Alert.svelte';
  import Badge from '$lib/components/Badge.svelte';
</script>

<svelte:head>
  <title>Drink Exchange Frontend</title>
  <meta name="description" content="Modernes Frontend-Setup für Live Views und PWA-Unterstützung." />
</svelte:head>

<div class="space-y-6">
  <Card title="Schnellstarter" description="Live Views & PWA">
    <p class="text-sm text-white/70">
      Dieses Setup kombiniert einen Dark-Mode-fokussierten Shell-Frame, Marktdaten und klare Komponenten für
      PWA/Big Screen Experiences.
      <Badge variant="muted">Bereit</Badge>
    </p>
  </Card>
  <Alert level="info">
    <p class="text-white/80 text-sm">
      Nutze die Navigation links, um zwischen user-, admin- und board-spezifischen Perspektiven zu wechseln.
    </p>
  </Alert>
</div>
