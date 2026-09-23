<script lang="ts">
  import '$lib/styles/app.css';
  import AppShell from '$lib/components/AppShell.svelte';
  import { locale } from '$lib/i18n';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  if (data?.preferredLocale) {
    locale.set(data.preferredLocale);
  }
</script>

<AppShell>
  <slot />
</AppShell>
