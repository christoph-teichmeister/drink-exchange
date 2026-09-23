<script lang="ts">
  import { untrack } from 'svelte'
  import Alert from '$lib/components/Alert.svelte'
  import Field from '$lib/components/admin/Field.svelte'
  import {
    describeFailure,
    parseNumbers,
    type SaveFeedback
  } from '$lib/components/admin/form-state'
  import { apiConfig } from '$lib/config'
  import { getI18nContext } from '$lib/i18n'
  import type { BarSettings } from '$lib/types'
  import { adminRequest, type FieldErrors } from '$lib/utils/admin-api'
  import { formatNumberInput } from '$lib/utils/locale-number'

  let { settings }: { settings: BarSettings } = $props()

  const { locale, translations } = getI18nContext()
  const t = $derived($translations.admin)

  const initial = untrack(() => settings)
  const initialLocale = untrack(() => $locale)
  let name = $state(initial.name)
  let description = $state(initial.description)
  let tick = $state(
    formatNumberInput(initial.tick_interval_seconds, initialLocale)
  )
  let reversion = $state(
    formatNumberInput(initial.reversion_rate, initialLocale)
  )
  let impulse = $state(formatNumberInput(initial.impulse_factor, initialLocale))
  let normalization = $state(
    formatNumberInput(initial.normalization_factor, initialLocale)
  )
  let retention = $state(
    formatNumberInput(initial.price_point_retention_ticks, initialLocale)
  )

  let errors = $state<FieldErrors>({})
  let feedback = $state<SaveFeedback>(null)
  let saving = $state(false)

  const save = async (event: SubmitEvent) => {
    event.preventDefault()
    feedback = null
    const parsed = parseNumbers(
      [
        { field: 'tick_interval_seconds', text: tick, integer: true },
        { field: 'reversion_rate', text: reversion },
        { field: 'impulse_factor', text: impulse },
        { field: 'normalization_factor', text: normalization },
        { field: 'price_point_retention_ticks', text: retention, integer: true }
      ],
      $locale,
      t
    )
    errors = parsed.errors
    if (Object.keys(parsed.errors).length) {
      feedback = { level: 'danger', text: t.feedback.invalid }
      return
    }
    saving = true
    try {
      await adminRequest<BarSettings>(
        fetch,
        'PATCH',
        apiConfig.barSettingsEndpoint(initial.slug),
        { name, description, ...parsed.values }
      )
      feedback = { level: 'success', text: t.feedback.saved }
    } catch (error) {
      ;({ errors, feedback } = describeFailure(error, t))
    } finally {
      saving = false
    }
  }

  const fields = $derived(t.settings.fields)
</script>

<form class="space-y-5" onsubmit={save} novalidate>
  <div class="grid gap-4 md:grid-cols-2">
    <Field id="settings-name" label={fields.name} errors={errors.name}>
      <input id="settings-name" class="ui-input" bind:value={name} required />
    </Field>
    <Field
      id="settings-description"
      label={fields.description}
      errors={errors.description}
    >
      <input
        id="settings-description"
        class="ui-input"
        bind:value={description}
      />
    </Field>
  </div>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
    <Field
      id="settings-tick"
      label={fields.tick}
      errors={errors.tick_interval_seconds}
    >
      <input
        id="settings-tick"
        class="ui-input font-mono"
        inputmode="numeric"
        bind:value={tick}
      />
    </Field>
    <Field
      id="settings-reversion"
      label={fields.reversion}
      errors={errors.reversion_rate}
    >
      <input
        id="settings-reversion"
        class="ui-input font-mono"
        inputmode="decimal"
        bind:value={reversion}
      />
    </Field>
    <Field
      id="settings-impulse"
      label={fields.impulse}
      errors={errors.impulse_factor}
    >
      <input
        id="settings-impulse"
        class="ui-input font-mono"
        inputmode="decimal"
        bind:value={impulse}
      />
    </Field>
    <Field
      id="settings-normalization"
      label={fields.normalization}
      errors={errors.normalization_factor}
    >
      <input
        id="settings-normalization"
        class="ui-input font-mono"
        inputmode="decimal"
        bind:value={normalization}
      />
    </Field>
    <Field
      id="settings-retention"
      label={fields.retention}
      errors={errors.price_point_retention_ticks}
    >
      <input
        id="settings-retention"
        class="ui-input font-mono"
        inputmode="numeric"
        bind:value={retention}
      />
    </Field>
  </div>
  <p class="text-sm text-ui-muted">{t.settings.hint}</p>
  <div class="flex flex-wrap items-center gap-3">
    <button class="ui-btn-primary" type="submit" disabled={saving}
      >{t.actions.save}</button
    >
    <div aria-live="polite">
      {#if feedback}
        <Alert level={feedback.level}>{feedback.text}</Alert>
      {/if}
    </div>
  </div>
  {#if errors.non_field}
    <Alert level="danger">{errors.non_field.join(' ')}</Alert>
  {/if}
</form>
