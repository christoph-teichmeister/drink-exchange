<script lang="ts">
  export let level: 'info' | 'warning' | 'danger' = 'info';

  const palette = {
    info: 'bg-white/5 border border-white/20 text-white/90',
    warning: 'bg-orange-400/10 border border-orange-400/30 text-orange-200',
    danger: 'bg-market-highlight/10 border border-market-highlight/40 text-market-highlight'
  };
</script>

<div class={`rounded-xl p-4 text-sm ${palette[level]}`}>
  <slot />
</div>
