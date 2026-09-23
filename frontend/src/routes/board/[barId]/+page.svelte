<script lang="ts">
  import BoardView from '$lib/components/BoardView.svelte'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()
</script>

<!--
  Keyed by bar so navigating /board/a -> /board/b tears down the old store and
  socket and builds fresh ones for the new bar.
-->
{#key data.snapshot.bar.slug}
  <BoardView snapshot={data.snapshot} />
{/key}
