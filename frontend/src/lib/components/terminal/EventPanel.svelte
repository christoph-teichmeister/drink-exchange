<script lang="ts">
  import { interpolate, type Locale, type Translation } from '$lib/i18n'
  import type { BoardEvent, EventType } from '$lib/stores/board'
  import { formatTime } from '$lib/utils/format'
  import { eventProgress, formatCountdown } from '$lib/utils/market'

  let {
    activeEvent,
    feed,
    now,
    locale,
    labels,
    untitled,
    hydrated
  }: {
    activeEvent: BoardEvent | null
    feed: BoardEvent[]
    now: number
    locale: Locale
    labels: Translation['board']['terminal']
    untitled: string
    hydrated: boolean
  } = $props()

  const typeKey = (type: EventType | null) => type ?? 'unknown'

  const typeTone = (type: EventType | null) => {
    switch (type) {
      case 'boom':
        return 'text-term-up'
      case 'crash':
        return 'text-term-down'
      case 'focus':
        return 'text-term-amber'
      default:
        return 'text-term-muted'
    }
  }

  const running = $derived(
    activeEvent && activeEvent.status === 'running' ? activeEvent : null
  )

  const remaining = $derived.by(() => {
    if (!running?.endsAt || !hydrated) {
      return null
    }
    const end = Date.parse(running.endsAt)
    return Number.isNaN(end) ? null : formatCountdown(end - now)
  })

  const progress = $derived(
    running && hydrated
      ? eventProgress(running.startsAt, running.endsAt, now)
      : null
  )

  const time = (value: string | null) =>
    (hydrated ? formatTime(value, locale, true) : null) ?? '--:--:--'
</script>

<section class="flex min-h-0 flex-col" aria-live="polite">
  <header
    class="flex items-center justify-between border-b border-term-line px-[clamp(1rem,1.6vw,2rem)] py-2 text-[clamp(0.65rem,0.75vw,0.9rem)] font-medium tracking-wider text-term-muted uppercase"
  >
    <span>{labels.event}</span>
    {#if running && remaining}
      <span class="font-mono text-term-amber normal-case"
        >{interpolate(labels.endsIn, { time: remaining })}</span
      >
    {:else if activeEvent?.status === 'ended'}
      <span class="font-mono">{labels.ended}</span>
    {/if}
  </header>

  <div class="px-[clamp(1rem,1.6vw,2rem)] py-[clamp(0.75rem,1.6vh,1.5rem)]">
    {#if activeEvent}
      <p class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span
          class={`font-mono text-[clamp(1.4rem,2.6vw,3.5rem)] leading-none font-bold uppercase ${typeTone(activeEvent.type)} ${activeEvent.status === 'ended' ? 'opacity-50' : ''}`}
        >
          {labels.eventTypes[typeKey(activeEvent.type)]}
        </span>
        <span
          class="text-[clamp(1.1rem,1.8vw,2.4rem)] leading-tight font-semibold"
        >
          {activeEvent.title ?? untitled}
        </span>
      </p>
      <p class="mt-2 text-[clamp(0.9rem,1.1vw,1.4rem)] text-term-text">
        {labels.eventEffects[typeKey(activeEvent.type)]}
      </p>
      {#if activeEvent.description}
        <p class="mt-1 text-[clamp(0.8rem,0.95vw,1.15rem)] text-term-muted">
          {activeEvent.description}
        </p>
      {/if}
      {#if progress !== null}
        <div class="mt-4 h-[3px] w-full bg-term-line" aria-hidden="true">
          <div
            class="h-full bg-term-amber"
            style:width={`${(1 - progress) * 100}%`}
          ></div>
        </div>
      {/if}
    {:else}
      <p class="text-[clamp(0.9rem,1.1vw,1.4rem)] text-term-muted">
        {labels.noEvent}
      </p>
    {/if}
  </div>

  <h2
    class="border-y border-term-line px-[clamp(1rem,1.6vw,2rem)] py-2 text-[clamp(0.65rem,0.75vw,0.9rem)] font-medium tracking-wider text-term-muted uppercase"
  >
    {labels.eventLog}
  </h2>
  <ol
    class="min-h-0 flex-1 overflow-hidden px-[clamp(1rem,1.6vw,2rem)] py-2 font-mono text-[clamp(0.75rem,0.85vw,1.05rem)]"
  >
    {#each feed as event (`${event.id}:${event.status}`)}
      <li
        class="grid grid-cols-[auto_6ch_auto_minmax(0,1fr)] gap-x-4 py-1 text-term-muted"
      >
        <span class="text-term-dim">{time(event.timestamp)}</span>
        <span
          >{event.status === 'ended'
            ? labels.logEnded
            : labels.logStarted}</span
        >
        <span class={`uppercase ${typeTone(event.type)}`}
          >{labels.eventTypes[typeKey(event.type)]}</span
        >
        <span class="truncate font-sans text-term-text"
          >{event.title ?? untitled}</span
        >
      </li>
    {:else}
      <li class="py-1 text-term-dim">{labels.logEmpty}</li>
    {/each}
  </ol>
</section>
