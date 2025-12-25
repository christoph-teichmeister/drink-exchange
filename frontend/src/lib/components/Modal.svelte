<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let open = false;
  export let title = '';
  export let size: 'sm' | 'md' | 'lg' = 'md';

  const dispatch = createEventDispatcher();

  const sizeClasses = {
    sm: 'max-w-lg',
    md: 'max-w-2xl',
    lg: 'max-w-4xl'
  };

  const close = () => dispatch('close');
</script>

{#if open}
  <div class="modal-backdrop" role="dialog" aria-modal="true">
    <div class={`rounded-3xl border border-white/20 bg-market-surface/80 p-6 backdrop-blur-lg ${sizeClasses[size]}`}>
      <header class="flex items-center justify-between gap-4 pb-4">
        <p class="text-lg font-semibold">{title}</p>
        <button type="button" class="text-white/70 hover:text-white" on:click={close} aria-label="Schließen">
          ✕
        </button>
      </header>
      <div class="space-y-4">
        <slot />
      </div>
    </div>
  </div>
{/if}
