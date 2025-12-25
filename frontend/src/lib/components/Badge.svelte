<script lang="ts">
  type BadgeVariant = 'accent' | 'success' | 'warning' | 'muted';

  export let variant: BadgeVariant = 'accent';

  const variants: Record<BadgeVariant, string> = {
    accent: 'bg-market-accent/20 text-market-accent border border-market-accent/50',
    success: 'bg-market-primary/20 text-market-primary border border-market-primary/50',
    warning: 'bg-orange-400/20 text-orange-400 border border-orange-400/40',
    muted: 'bg-white/10 text-white border border-white/20'
  };
</script>

<span class={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest ${variants[variant]}`}>
  <slot />
</span>
