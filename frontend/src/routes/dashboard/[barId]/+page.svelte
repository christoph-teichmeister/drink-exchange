<script lang="ts">
  import TradingDesk from '$lib/components/desk/TradingDesk.svelte'
  import { getI18nContext } from '$lib/i18n'
  import { canManageBar } from '$lib/utils/roles'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()

  const { translations } = getI18nContext()

  // `||` on purpose: an empty description from the backend must fall back too.
  const description = $derived(
    data.bar.description?.trim() || $translations.dashboard.subtitle
  )
</script>

<!-- Keyed by bar so switching bars tears down the old store and socket. -->
{#key data.snapshot.bar.slug}
  <TradingDesk
    snapshot={data.snapshot}
    {description}
    canManage={canManageBar(data.bar.role)}
  />
{/key}
