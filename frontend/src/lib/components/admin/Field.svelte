<script lang="ts">
  import type { Snippet } from 'svelte'

  // Label + control + inline field errors. The control is rendered by the
  // caller and must use `id` so the label stays associated.
  let {
    id,
    label,
    errors = [],
    class: className = '',
    children
  }: {
    id: string
    label: string
    errors?: string[]
    class?: string
    children: Snippet
  } = $props()
</script>

<div class={`space-y-1.5 ${className}`}>
  <label for={id} class="ui-label block">{label}</label>
  {@render children()}
  {#each errors as message (message)}
    <p class="text-sm text-ui-down" id={`${id}-error`}>{message}</p>
  {/each}
</div>
