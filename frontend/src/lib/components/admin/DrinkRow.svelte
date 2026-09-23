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
  import { getI18nContext, interpolate } from '$lib/i18n'
  import type { DrinkConfig } from '$lib/types'
  import { adminRequest, type FieldErrors } from '$lib/utils/admin-api'
  import { formatNumberInput } from '$lib/utils/locale-number'

  // Edits an existing drink, or creates one when `drink` is null.
  let {
    drink,
    barSlug,
    onSaved,
    onDeleted = () => {}
  }: {
    drink: DrinkConfig | null
    barSlug: string
    onSaved: (drink: DrinkConfig) => void
    onDeleted?: (id: number) => void
  } = $props()

  const { locale, translations } = getI18nContext()
  const t = $derived($translations.admin)
  const f = $derived(t.drinks.fields)

  const source = untrack(() => drink)
  const loc = untrack(() => $locale)
  const key = source ? `drink-${source.id}` : 'drink-new'
  const empty = () => ({
    name: source?.name ?? '',
    base: formatNumberInput(source?.base_price, loc),
    min: formatNumberInput(source?.min_price, loc),
    max: formatNumberInput(source?.max_price, loc),
    volatility: formatNumberInput(source?.volatility ?? 0.05, loc),
    weight: formatNumberInput(source?.weight ?? 1, loc),
    step: formatNumberInput(source?.rounding_step, loc)
  })
  let values = $state(empty())
  let errors = $state<FieldErrors>({})
  let feedback = $state<SaveFeedback>(null)
  let busy = $state(false)

  const save = async (event: SubmitEvent) => {
    event.preventDefault()
    feedback = null
    const parsed = parseNumbers(
      [
        { field: 'base_price', text: values.base },
        { field: 'min_price', text: values.min },
        { field: 'max_price', text: values.max },
        { field: 'volatility', text: values.volatility },
        { field: 'weight', text: values.weight },
        { field: 'rounding_step', text: values.step, optional: true }
      ],
      $locale,
      t
    )
    errors = parsed.errors
    if (!values.name.trim()) {
      errors = { ...errors, name: [t.validation.required] }
    }
    if (Object.keys(errors).length) {
      feedback = { level: 'danger', text: t.feedback.invalid }
      return
    }
    busy = true
    try {
      const saved = await adminRequest<DrinkConfig>(
        fetch,
        source ? 'PATCH' : 'POST',
        apiConfig.barDrinksEndpoint(barSlug, source?.id),
        { name: values.name.trim(), ...parsed.values }
      )
      onSaved(saved)
      if (source) {
        feedback = { level: 'success', text: t.feedback.saved }
      } else {
        values = empty()
        feedback = { level: 'success', text: t.feedback.created }
      }
    } catch (error) {
      ;({ errors, feedback } = describeFailure(error, t))
    } finally {
      busy = false
    }
  }

  const remove = async () => {
    if (!source) return
    if (
      !window.confirm(
        interpolate(t.drinks.confirmDelete, { name: source.name })
      )
    ) {
      return
    }
    busy = true
    feedback = null
    try {
      await adminRequest(
        fetch,
        'DELETE',
        apiConfig.barDrinksEndpoint(barSlug, source.id)
      )
      onDeleted(source.id)
    } catch (error) {
      ;({ errors, feedback } = describeFailure(error, t))
      busy = false
    }
  }
</script>

<form class="space-y-3 px-5 py-4" onsubmit={save} novalidate>
  <div
    class="grid gap-3 sm:grid-cols-4 lg:grid-cols-[minmax(10rem,2fr)_repeat(6,minmax(0,1fr))]"
  >
    <Field
      id={`${key}-name`}
      label={f.name}
      errors={errors.name}
      class="sm:col-span-4 lg:col-span-1"
    >
      <input id={`${key}-name`} class="ui-input" bind:value={values.name} />
    </Field>
    <Field id={`${key}-base`} label={f.base} errors={errors.base_price}>
      <input
        id={`${key}-base`}
        class="ui-input font-mono"
        inputmode="decimal"
        bind:value={values.base}
      />
    </Field>
    <Field id={`${key}-min`} label={f.min} errors={errors.min_price}>
      <input
        id={`${key}-min`}
        class="ui-input font-mono"
        inputmode="decimal"
        bind:value={values.min}
      />
    </Field>
    <Field id={`${key}-max`} label={f.max} errors={errors.max_price}>
      <input
        id={`${key}-max`}
        class="ui-input font-mono"
        inputmode="decimal"
        bind:value={values.max}
      />
    </Field>
    <Field id={`${key}-step`} label={f.step} errors={errors.rounding_step}>
      <input
        id={`${key}-step`}
        class="ui-input font-mono"
        inputmode="decimal"
        placeholder="—"
        bind:value={values.step}
      />
    </Field>
    <Field
      id={`${key}-volatility`}
      label={f.volatility}
      errors={errors.volatility}
    >
      <input
        id={`${key}-volatility`}
        class="ui-input font-mono"
        inputmode="decimal"
        bind:value={values.volatility}
      />
    </Field>
    <Field id={`${key}-weight`} label={f.weight} errors={errors.weight}>
      <input
        id={`${key}-weight`}
        class="ui-input font-mono"
        inputmode="decimal"
        bind:value={values.weight}
      />
    </Field>
  </div>
  {#if errors.non_field}
    <Alert level="danger">{errors.non_field.join(' ')}</Alert>
  {/if}
  <div class="flex flex-wrap items-center gap-3">
    <button class="ui-btn-primary" type="submit" disabled={busy}>
      {source ? t.actions.save : t.drinks.add}
    </button>
    {#if source}
      <button
        class="ui-btn"
        type="button"
        disabled={busy || source.has_trades}
        title={source.has_trades ? t.drinks.hasTrades : undefined}
        onclick={remove}>{t.actions.delete}</button
      >
      {#if source.has_trades}
        <span class="text-sm text-ui-dim">{t.drinks.hasTrades}</span>
      {/if}
    {/if}
    <div aria-live="polite">
      {#if feedback}
        <Alert level={feedback.level}>{feedback.text}</Alert>
      {/if}
    </div>
  </div>
</form>
