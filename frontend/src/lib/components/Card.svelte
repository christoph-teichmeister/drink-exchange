<script lang="ts">
  import type { Snippet } from 'svelte'

  // A hairline-bordered panel. `title` is the small uppercase label, `heading`
  // the optional prominent line below it.
  let {
    title = '',
    heading = '',
    children
  }: {
    title?: string
    heading?: string
    children: Snippet
  } = $props()
</script>

<section class="rounded-sm border border-ui-line bg-ui-panel">
  {#if title || heading}
    <header class="border-b border-ui-line px-5 py-4">
      {#if title}
        <p class="ui-label">{title}</p>
      {/if}
      {#if heading}
        <h1 class="mt-1 text-xl font-semibold tracking-tight">{heading}</h1>
      {/if}
    </header>
  {/if}
  <div class="space-y-4 px-5 py-5">
    {@render children()}
  </div>
</section>
