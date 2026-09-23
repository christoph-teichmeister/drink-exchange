<script lang="ts">
  import TerminalBoard from '$lib/components/terminal/TerminalBoard.svelte'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()
</script>

<!--
  Keyed by bar so navigating /board/a -> /board/b tears down the old store and
  socket and builds fresh ones for the new bar.
-->
{#key data.snapshot.bar.slug}
  <TerminalBoard snapshot={data.snapshot} />
{/key}
