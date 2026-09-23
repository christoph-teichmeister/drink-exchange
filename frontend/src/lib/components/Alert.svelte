<script lang="ts">
  import type { Snippet } from 'svelte'

  type AlertLevel = 'info' | 'warning' | 'danger' | 'success'

  let { level = 'info', children }: { level?: AlertLevel; children: Snippet } =
    $props()

  // Full hairline border in the level color; no side stripes, no fills.
  const palette: Record<AlertLevel, string> = {
    info: 'border-ui-line-strong text-ui-text',
    warning: 'border-ui-accent text-ui-accent',
    danger: 'border-ui-down text-ui-down',
    success: 'border-ui-up text-ui-up'
  }
</script>

<div class={`rounded-sm border px-4 py-3 text-sm ${palette[level]}`}>
  {@render children()}
</div>
