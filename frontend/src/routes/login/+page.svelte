<script lang="ts">
  import { resolve } from '$app/paths'
  import { goto } from '$app/navigation'
  import Alert from '$lib/components/Alert.svelte'
  import Card from '$lib/components/Card.svelte'
  import { getI18nContext } from '$lib/i18n'
  import { LoginError, loginUser } from '$lib/stores/auth'

  const { translations } = getI18nContext()

  let username = $state('')
  let password = $state('')
  let isSubmitting = $state(false)
  let errorMessage: string | null = $state(null)

  const messageForError = (error: unknown) => {
    const messages = $translations.auth.login.errors
    if (!(error instanceof LoginError)) {
      return messages.general
    }
    if (error.status === 400 || error.status === 401) {
      return messages.invalid
    }
    if (error.status === 403) {
      return messages.disabled
    }
    return messages.general
  }

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
      // Re-run the server loads so the layout picks up the new session.
      await goto(resolve('/board'), { invalidateAll: true })
    } catch (error) {
      errorMessage = messageForError(error)
    } finally {
      isSubmitting = false
    }
  }
</script>

<svelte:head>
  <title>{$translations.auth.login.pageTitle}</title>
</svelte:head>

<div
  class="flex min-h-[calc(100vh-96px)] items-center justify-center px-4 py-8"
>
  <Card
    title={$translations.auth.login.pageTitle}
    description={$translations.auth.login.description}
  >
    <!-- method="post" keeps credentials out of the URL if the form is submitted before hydration. -->
    <form class="space-y-5" method="post" onsubmit={handleSubmit}>
      {#if errorMessage}
        <div role="alert">
          <Alert level="danger">
            <p class="text-sm">{errorMessage}</p>
          </Alert>
        </div>
      {/if}
      <div class="space-y-2">
        <label
          for="login-username"
          class="text-xs tracking-[0.35em] text-white/60 uppercase"
          >{$translations.auth.login.usernameLabel}</label
        >
        <input
          id="login-username"
          class="w-full rounded-2xl border border-white/10 bg-market-surface/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-market-accent/60 focus:outline-hidden"
          type="text"
          name="username"
          autocomplete="username"
          bind:value={username}
          required
        />
      </div>
      <div class="space-y-2">
        <label
          for="login-password"
          class="text-xs tracking-[0.35em] text-white/60 uppercase"
          >{$translations.auth.login.passwordLabel}</label
        >
        <input
          id="login-password"
          class="w-full rounded-2xl border border-white/10 bg-market-surface/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-market-accent/60 focus:outline-hidden"
          type="password"
          name="password"
          autocomplete="current-password"
          bind:value={password}
          required
        />
      </div>
      <button
        class="w-full rounded-2xl bg-market-primary px-4 py-3 text-xs font-semibold tracking-[0.4em] text-white uppercase transition hover:bg-market-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
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
