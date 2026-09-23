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

<div class="flex min-h-[70dvh] items-center justify-center py-8">
  <div class="w-full max-w-sm">
    <Card
      title={$translations.auth.login.pageTitle}
      heading={$translations.auth.login.description}
    >
      <!-- method="post" keeps credentials out of the URL if the form is submitted before hydration. -->
      <form class="space-y-5" method="post" onsubmit={handleSubmit}>
        {#if errorMessage}
          <div role="alert">
            <Alert level="danger">{errorMessage}</Alert>
          </div>
        {/if}
        <div class="space-y-2">
          <label for="login-username" class="ui-label"
            >{$translations.auth.login.usernameLabel}</label
          >
          <input
            id="login-username"
            class="ui-input"
            type="text"
            name="username"
            autocomplete="username"
            bind:value={username}
            required
          />
        </div>
        <div class="space-y-2">
          <label for="login-password" class="ui-label"
            >{$translations.auth.login.passwordLabel}</label
          >
          <input
            id="login-password"
            class="ui-input"
            type="password"
            name="password"
            autocomplete="current-password"
            bind:value={password}
            required
          />
        </div>
        <button
          class="ui-btn-primary w-full py-3"
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {$translations.auth.login.submitLabel}
        </button>
        <p class="text-sm text-ui-muted">{$translations.auth.login.helper}</p>
      </form>
    </Card>
  </div>
</div>
