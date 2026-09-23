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
  import type { DrinkConfig, EventConfig, EventType } from '$lib/types'
  import { adminRequest, type FieldErrors } from '$lib/utils/admin-api'
  import { formatNumberInput } from '$lib/utils/locale-number'

  // Edits an existing event definition, or creates one when `event` is null.
  let {
    event,
    barSlug,
    drinks,
    onSaved,
    onDeleted = () => {}
  }: {
    event: EventConfig | null
    barSlug: string
    drinks: DrinkConfig[]
    onSaved: (event: EventConfig) => void
    onDeleted?: (id: number) => void
  } = $props()

  const { locale, translations } = getI18nContext()
  const t = $derived($translations.admin)
  const f = $derived(t.events.fields)
  const types: EventType[] = ['boom', 'crash', 'focus', 'normalize']

  const source = untrack(() => event)
  const loc = untrack(() => $locale)
  const key = source ? `event-${source.id}` : 'event-new'
  const empty = () => ({
    name: source?.name ?? '',
    description: source?.description ?? '',
    type: (source?.type ?? 'boom') as EventType,
    weight: formatNumberInput(source?.probability_weight ?? 1, loc),
    duration: formatNumberInput(source?.duration_seconds ?? 60, loc),
    cooldown: formatNumberInput(source?.cooldown_seconds, loc),
    multiplier: formatNumberInput(source?.params.start_multiplier, loc),
    targets: [...(source?.params.target_drink_ids ?? [])]
  })
  let values = $state(empty())
  let errors = $state<FieldErrors>({})
  let feedback = $state<SaveFeedback>(null)
  let busy = $state(false)

  const toggleTarget = (id: number, checked: boolean) => {
    values.targets = checked
      ? [...values.targets, id]
      : values.targets.filter((target) => target !== id)
  }

  const save = async (submit: SubmitEvent) => {
    submit.preventDefault()
    feedback = null
    const parsed = parseNumbers(
      [
        { field: 'probability_weight', text: values.weight },
        { field: 'duration_seconds', text: values.duration, integer: true },
        {
          field: 'cooldown_seconds',
          text: values.cooldown,
          optional: true,
          integer: true
        },
        { field: 'start_multiplier', text: values.multiplier, optional: true }
      ],
      $locale,
      t
    )
    const { start_multiplier: multiplier, ...numbers } = parsed.values
    errors = parsed.errors.start_multiplier
      ? { ...parsed.errors, params: parsed.errors.start_multiplier }
      : parsed.errors
    if (!values.name.trim()) {
      errors = { ...errors, name: [t.validation.required] }
    }
    if (Object.keys(errors).length) {
      feedback = { level: 'danger', text: t.feedback.invalid }
      return
    }
    const params: Record<string, unknown> = {}
    if (multiplier !== null && multiplier !== undefined) {
      params.start_multiplier = multiplier
    }
    if (values.type === 'focus') {
      params.target_drink_ids = values.targets
    }
    busy = true
    try {
      const saved = await adminRequest<EventConfig>(
        fetch,
        source ? 'PATCH' : 'POST',
        apiConfig.barEventsEndpoint(barSlug, source?.id),
        {
          name: values.name.trim(),
          description: values.description,
          type: values.type,
          ...numbers,
          params
        }
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
        interpolate(t.events.confirmDelete, { name: source.name })
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
        apiConfig.barEventsEndpoint(barSlug, source.id)
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
    class="grid gap-3 sm:grid-cols-3 lg:grid-cols-[minmax(10rem,2fr)_minmax(8rem,1fr)_repeat(4,minmax(0,1fr))]"
  >
    <Field
      id={`${key}-name`}
      label={f.name}
      errors={errors.name}
      class="sm:col-span-3 lg:col-span-1"
    >
      <input id={`${key}-name`} class="ui-input" bind:value={values.name} />
    </Field>
    <Field id={`${key}-type`} label={f.type} errors={errors.type}>
      <select id={`${key}-type`} class="ui-input" bind:value={values.type}>
        {#each types as type (type)}
          <option value={type}
            >{$translations.board.terminal.eventTypes[type]}</option
          >
        {/each}
      </select>
    </Field>
    <Field
      id={`${key}-weight`}
      label={f.weight}
      errors={errors.probability_weight}
    >
      <input
        id={`${key}-weight`}
        class="ui-input font-mono"
        inputmode="decimal"
        bind:value={values.weight}
      />
    </Field>
    <Field
      id={`${key}-duration`}
      label={f.duration}
      errors={errors.duration_seconds}
    >
      <input
        id={`${key}-duration`}
        class="ui-input font-mono"
        inputmode="numeric"
        bind:value={values.duration}
      />
    </Field>
    <Field
      id={`${key}-cooldown`}
      label={f.cooldown}
      errors={errors.cooldown_seconds}
    >
      <input
        id={`${key}-cooldown`}
        class="ui-input font-mono"
        inputmode="numeric"
        placeholder="—"
        bind:value={values.cooldown}
      />
    </Field>
    <Field id={`${key}-multiplier`} label={f.multiplier} errors={errors.params}>
      <input
        id={`${key}-multiplier`}
        class="ui-input font-mono"
        inputmode="decimal"
        placeholder="—"
        bind:value={values.multiplier}
      />
    </Field>
  </div>
  <Field
    id={`${key}-description`}
    label={f.description}
    errors={errors.description}
  >
    <input
      id={`${key}-description`}
      class="ui-input"
      bind:value={values.description}
    />
  </Field>
  {#if values.type === 'focus'}
    <fieldset class="space-y-2">
      <legend class="ui-label">{f.targets}</legend>
      <div class="flex flex-wrap gap-x-5 gap-y-2">
        {#each drinks as drink (drink.id)}
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="h-4 w-4 accent-(--ui-accent)"
              checked={values.targets.includes(drink.id)}
              onchange={(change) =>
                toggleTarget(
                  drink.id,
                  (change.currentTarget as HTMLInputElement).checked
                )}
            />
            {drink.name}
          </label>
        {/each}
      </div>
    </fieldset>
  {/if}
  {#if errors.non_field}
    <Alert level="danger">{errors.non_field.join(' ')}</Alert>
  {/if}
  <div class="flex flex-wrap items-center gap-3">
    <button class="ui-btn-primary" type="submit" disabled={busy}>
      {source ? t.actions.save : t.events.add}
    </button>
    {#if source}
      <button class="ui-btn" type="button" disabled={busy} onclick={remove}
        >{t.actions.delete}</button
      >
    {/if}
    <div aria-live="polite">
      {#if feedback}
        <Alert level={feedback.level}>{feedback.text}</Alert>
      {/if}
    </div>
  </div>
</form>
