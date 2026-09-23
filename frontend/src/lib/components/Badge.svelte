<script lang="ts">
  import type { Snippet } from 'svelte'

  type BadgeVariant = 'accent' | 'up' | 'down' | 'muted'

  let {
    variant = 'muted',
    children
  }: { variant?: BadgeVariant; children: Snippet } = $props()

  const variants: Record<BadgeVariant, string> = {
    accent: 'border-ui-accent text-ui-accent',
    up: 'border-ui-up text-ui-up',
    down: 'border-ui-down text-ui-down',
    muted: 'border-ui-line-strong text-ui-muted'
  }
</script>

<span
  class={`inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[0.7rem] font-semibold tracking-wider uppercase ${variants[variant]}`}
>
  {@render children()}
</span>
