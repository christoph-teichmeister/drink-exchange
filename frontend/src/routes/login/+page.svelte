<script lang="ts">
  import { goto } from '$app/navigation'
  import Alert from '$lib/components/Alert.svelte'
  import Card from '$lib/components/Card.svelte'
  import { loginUser } from '$lib/stores/auth'
  import { translations } from '$lib/i18n'

  let username = ''
  let password = ''
  let isSubmitting = false
  let errorMessage: string | null = null

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    if (!username.trim() || !password) {
      errorMessage = $translations.auth.login.errors.required
      return
    }

    isSubmitting = true
    errorMessage = null

    try {
      await loginUser(fetch, { username: username.trim(), password })
      await goto('/board')
    } catch (unhandled) {
      let fallback = $translations.auth.login.errors.general
      if (unhandled instanceof Response) {
        const payload = (await unhandled.json().catch(() => null)) ?? {}
        fallback = (payload.detail as string) ?? $translations.auth.login.errors.invalid
      }
      errorMessage = fallback
    } finally {
      isSubmitting = false
    }
  }
</script>

<svelte:head>
  <title>{$translations.auth.login.pageTitle}</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-96px)] items-center justify-center px-4 py-8">
  <Card
    title={$translations.auth.login.pageTitle}
    description={$translations.auth.login.description}
  >
    <form class="space-y-5" on:submit={handleSubmit}>
      {#if errorMessage}
        <Alert level="danger">
          <p class="text-sm">{errorMessage}</p>
        </Alert>
      {/if}
      <div class="space-y-2">
        <label class="text-xs uppercase tracking-[0.35em] text-white/60">{$translations.auth.login.usernameLabel}</label>
        <input
          class="w-full rounded-2xl border border-white/10 bg-market-surface/20 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-market-accent/60 focus:outline-none"
          type="text"
          name="username"
          autocomplete="username"
          bind:value={username}
          required
        />
      </div>
      <div class="space-y-2">
        <label class="text-xs uppercase tracking-[0.35em] text-white/60">{$translations.auth.login.passwordLabel}</label>
        <input
          class="w-full rounded-2xl border border-white/10 bg-market-surface/20 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-market-accent/60 focus:outline-none"
          type="password"
          name="password"
          autocomplete="current-password"
          bind:value={password}
          required
        />
      </div>
      <button
        class="w-full rounded-2xl bg-market-primary px-4 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-white transition hover:bg-market-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {$translations.auth.login.submitLabel}
      </button>
      <p class="text-xs text-white/60">{$translations.auth.login.helper}</p>
    </form>
  </Card>
</div>
