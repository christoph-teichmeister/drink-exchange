import { browser } from '$app/environment'
import { derived, writable } from 'svelte/store'

const de = {
  layout: {
    headerSubtitle: 'Drink Exchange',
    headerTitle: 'Live Engineering Console',
    headerBadge: 'Live',
    navLabel: 'Navigation',
    navToggleLabel: 'Navigation umschalten',
    navNow: 'jetzt',
    navItems: [
      { title: 'User', description: 'Individuelle Dashboards', path: '/user' },
      { title: 'Admin', description: 'Operations-Cockpit', path: '/admin' },
      {
        title: 'Board',
        description: 'Big Screen & Events',
        path: '/board'
      },
      {
        title: 'Hilfe',
        description: 'Anleitungen & Überblick',
        path: '/help'
      }
    ],
    language: {
      label: 'Sprache',
      options: [
        { code: 'de', label: 'Deutsch' },
        { code: 'en', label: 'Englisch' }
      ]
    },
    colorMode: {
      label: 'Farbmodus',
      options: {
        night: 'Nacht',
        day: 'Tag'
      }
    }
  },
  home: {
    pageTitle: 'Drink Exchange Frontend',
    description:
      'Modernes Frontend-Setup für Live Views und PWA-Unterstützung.',
    quickStart: {
      title: 'Schnellstarter',
      description: 'Live Views & PWA',
      body: 'Dieses Setup kombiniert einen Dark-Mode-fokussierten Shell-Frame, Marktdaten und klare Komponenten für PWA/Big Screen Experiences.',
      badge: 'Bereit'
    },
    alert:
      'Nutze die Navigation links, um zwischen user-, admin- und board-spezifischen Perspektiven zu wechseln.'
  },
  user: {
    pageTitle: 'User Experience',
    cardTitle: 'User Portal',
    cardDescription: 'Kunden-Dashboard',
    tableHeaders: { signal: 'Signal', status: 'Status' },
    alert: {
      badge: 'Hinweis',
      message:
        'Die Preise werden live über das Big Screen-Konzept aktualisiert.'
    },
    portfolio: [
      { label: 'Barrel ETF', progress: '42%' },
      { label: 'Lager Basket', progress: '68%' },
      { label: 'Mixology Blend', progress: '31%' }
    ],
    announcements: [
      { title: 'Live Update', body: 'Orders warten auf Freigabe.' },
      { title: 'Neue Preise', body: 'Heute gibt es 5% Rabatt auf Premium-Mix.' }
    ]
  },
  admin: {
    pageTitle: 'Admin Cockpit',
    cardTitle: 'Admin Cockpit',
    cardDescription: 'Steuere alle Wall Street Drinks',
    badges: { operations: 'Operations', watch: 'Watch' },
    buttonSchedule: 'Ereignis planen',
    tableHeaders: { job: 'Job', status: 'Status' },
    operations: [
      { id: 'anime', name: 'Automatisierte Bar', status: 'Gesund' },
      { id: 'ledger', name: 'Ledger Jobs', status: 'Ausstehend' },
      { id: 'audit', name: 'Audit Queue', status: 'Verzögert' }
    ],
    upcoming: [
      { title: 'Health Check', info: 'In 4 Minuten' },
      { title: 'Batch Settlements', info: 'In 12 Minuten' }
    ],
    modal: {
      title: 'Ereignis planen',
      body: 'Live Events erscheinen automatisch auf dem Big Screen.',
      confirm: 'Bestätigen'
    }
  },
  board: {
    pageTitle: 'Board View',
    lobby: {
      pageTitle: 'Board-Lobby',
      subtitle: 'Wähle eine Bar, um ihr Live-Board aufzurufen.',
      description:
        'Jede Location streamt Live-Preise und Events. Wähle eine Bar aus, um ihren Big Screen zu öffnen.',
      empty: 'Noch keine Bars konfiguriert.',
      openBoard: 'Board öffnen'
    },
    header: { kicker: 'High Contrast Board', title: 'Ticker & Event Command' },
    badges: {
      live: 'live',
      connecting: 'verbindet...',
      connected: 'verbunden'
    },
    ticker: {
      label: 'Live-Ticker',
      subTitle: 'Trading Floor Live-Board'
    },
    card: {
      priceLabel: 'Aktueller Preis',
      deltaLabel: 'Delta',
      trendLabel: 'Trend',
      empty: 'Warten auf Drinks...'
    },
    trendLabels: {
      up: 'Steigend',
      down: 'Fallend',
      flat: 'Stabil'
    },
    actions: {
      reconnect: 'Verbindung neu starten'
    },
    chart: {
      sectionTitle: 'Preise',
      subTitle: 'Gemeinsame Kurvenansicht pro Bar',
      chartBadge: 'Live',
      legendTitle: 'Legende',
      button: 'Neustart',
      tableHeaders: { metric: 'Metrik', value: 'Wert' },
      lastUpdated: 'Letztes Update',
      noTimestamp: '—',
      tooltip: {
        label: 'Letzte Werte',
        empty: 'Warten auf Preisdaten'
      },
      pointsLabel: 'Punkte'
    },
    eventOverlay: {
      label: 'Live Event',
      started: 'Event gestartet',
      ended: 'Event beendet',
      idle: 'Warten auf Events...',
      live: 'Live Event'
    },
    eventFeed: {
      title: 'Event Feed',
      empty: 'Noch keine Events verfügbar.'
    },
    alert: {
      prefix: 'Events und Preise werden über ',
      eventChannel: 'event.*',
      middle: ' und ',
      priceChannel: 'prices.update',
      suffix: ' gesteuert.'
    },
    connectionStatus: {
      connecting: 'verbindet...',
      connected: 'verbunden',
      reconnecting: 'verbindet neu...',
      disconnected: 'offline'
    }
  },
  help: {
    pageTitle: 'Hilfecenter',
    hero: {
      title: 'Kenntnisse über alle Bereiche der Konsole',
      subtitle:
        'Leitfäden, Überblick über Ansichten und Aktionsreferenzen für das Drink Exchange Frontend.'
    },
    introParagraphs: [
      'Nutze die Navigation, um zwischen User-, Admin- und Board-Ansichten zu wechseln.',
      'Jede Perspektive streamt Live-Daten; diese Seite erklärt Signale, Boards und Events, damit du sicher handelst.'
    ],
    learnSections: [
      {
        title: 'Ansichten & Rollen',
        description:
          'Jede Sicht ist auf eine Rolle zugeschnitten. Lies die wichtigsten Aufgaben bevor du loslegst.',
        cards: [
          {
            name: 'User-Ansicht',
            summary:
              'Kundennahe Insights mit Live-Signalen, Portfoliotrends und freigegebenen Ankündigungen.',
            actions: [
              {
                label: 'Signale-Tabelle',
                detail:
                  'Zeigt den Echtzeitstatus von Watchlists und Trading-Signalen.'
              },
              {
                label: 'Portfolio-Karten',
                detail:
                  'Progress-Bars zeigen, wie Drinks über die Zeit performen.'
              }
            ]
          },
          {
            name: 'Admin-Ansicht',
            summary:
              'Operations-Cockpit zur Überwachung von Hintergrundjobs und Planung von Live-Events.',
            actions: [
              {
                label: 'Operations-Badges',
                detail:
                  'Schnelle Gesundheitschecks für automatisierte Bars, Ledger und Audits.'
              },
              {
                label: 'Ereignis planen',
                detail:
                  'Öffnet das Modal, das neue Events auf das Board bringt.'
              }
            ]
          },
          {
            name: 'Board-Ansicht',
            summary:
              'Big Screen-Erlebnis mit Verbindungsstatus, Ticker und Live-Charts.',
            actions: [
              {
                label: 'Board-Lobby',
                detail: 'Wähle eine Bar, um ihren Board-Stream zu öffnen.'
              },
              {
                label: 'Board neu verbinden',
                detail:
                  'Startet die SSE-Verbindung neu, wenn das Board offline geht.'
              }
            ]
          }
        ]
      },
      {
        title: 'Aktionen & Events',
        description:
          'Verfolge, wie Aktionen in Events münden und wie die UI reagiert.',
        cards: [
          {
            name: 'Event-Overlay',
            summary:
              'Zeigt den aktuellen Eventstatus auf dem Board, sodass alle den neuesten Ablauf sehen.',
            actions: [
              {
                label: 'Event.*-Kanal',
                detail:
                  'Sendet Lifecycle-Events (gestartet, beendet, idle) an die Boards.'
              },
              {
                label: 'Event-Feed',
                detail:
                  'Streaming aktivierter und geplanter Eventtitel für Kontext.'
              }
            ]
          },
          {
            name: 'Preisupdates',
            summary:
              'Charts und Ticker lauschen auf Preis-Events, damit alle Werte aktuell bleiben.',
            actions: [
              {
                label: 'prices.update-Kanal',
                detail: 'Versorgt die Liniencharts mit neuen Preiswerten.'
              },
              {
                label: 'Eventpunkte',
                detail: 'Jeder Wertepunkt bekommt Zeitstempel und Trendlabel.'
              }
            ]
          }
        ]
      },
      {
        title: 'Konnektivität & Best Practices',
        description: 'Halte das Big Screen stabil und bereit für Events.',
        cards: [
          {
            name: 'Verbindungsstatus',
            summary:
              'Status wechselt zwischen verbindet, verbunden, verbindet neu und offline.',
            actions: [
              {
                label: 'Verbindet',
                detail:
                  'Erscheint, während der SSE-Stream startet oder automatisch neu verbindet.'
              },
              {
                label: 'Neustart-Button',
                detail:
                  'Startet den Stream manuell neu, wenn automatische Versuche stocken.'
              }
            ]
          },
          {
            name: 'Bereitschaftshinweise',
            summary:
              'Farben, Badges und Hinweise zeigen, dass die Daten live sind.',
            actions: [
              {
                label: 'Live-Badge',
                detail: 'Bestätigt, dass die Konsole Daten streamt.'
              },
              {
                label: 'Hinweisbanner',
                detail: 'Erklärt, woher Events und Preisdaten stammen.'
              }
            ]
          }
        ]
      }
    ],
    footer:
      'Mehr Hilfe gewünscht? Schau in die Dokumentation oder kontaktiere das Operations-Team.'
  }
} as const

const en = {
  layout: {
    headerSubtitle: 'Drink Exchange',
    headerTitle: 'Live Engineering Console',
    headerBadge: 'Live',
    navLabel: 'Navigation',
    navToggleLabel: 'Toggle navigation',
    navNow: 'now',
    navItems: [
      { title: 'User', description: 'Individual dashboards', path: '/user' },
      { title: 'Admin', description: 'Operations cockpit', path: '/admin' },
      {
        title: 'Board',
        description: 'Big screen & events',
        path: '/board'
      },
      {
        title: 'Help',
        description: 'Guides & overview',
        path: '/help'
      }
    ],
    language: {
      label: 'Language',
      options: [
        { code: 'de', label: 'German' },
        { code: 'en', label: 'English' }
      ]
    },
    colorMode: {
      label: 'Color mode',
      options: {
        night: 'Night',
        day: 'Day'
      }
    }
  },
  home: {
    pageTitle: 'Drink Exchange Frontend',
    description: 'Modern front-end setup for live views and PWA support.',
    quickStart: {
      title: 'Quickstart',
      description: 'Live views & PWA',
      body: 'This setup pairs a dark-mode-focused shell frame with market data and clear components for PWA/big-screen experiences.',
      badge: 'Ready'
    },
    alert:
      'Use the navigation on the left to jump between the user, admin, and board perspectives.'
  },
  user: {
    pageTitle: 'User Experience',
    cardTitle: 'User Portal',
    cardDescription: 'Customer dashboard',
    tableHeaders: { signal: 'Signal', status: 'Status' },
    alert: {
      badge: 'Note',
      message: 'Prices refresh live through the Big Screen concept.'
    },
    portfolio: [
      { label: 'Barrel ETF', progress: '42%' },
      { label: 'Lager Basket', progress: '68%' },
      { label: 'Mixology Blend', progress: '31%' }
    ],
    announcements: [
      { title: 'Live Update', body: 'Orders are waiting for approval.' },
      { title: 'Pricing News', body: 'Today we have 5% off premium mixes.' }
    ]
  },
  admin: {
    pageTitle: 'Admin Cockpit',
    cardTitle: 'Admin Cockpit',
    cardDescription: 'Steer all Wall Street drinks',
    badges: { operations: 'Operations', watch: 'Watch' },
    buttonSchedule: 'Schedule event',
    tableHeaders: { job: 'Job', status: 'Status' },
    operations: [
      { id: 'anime', name: 'Automated Bar', status: 'Healthy' },
      { id: 'ledger', name: 'Ledger Jobs', status: 'Pending' },
      { id: 'audit', name: 'Audit Queue', status: 'Delayed' }
    ],
    upcoming: [
      { title: 'Health Check', info: 'In 4 minutes' },
      { title: 'Batch Settlements', info: 'In 12 minutes' }
    ],
    modal: {
      title: 'Schedule event',
      body: 'Live events automatically appear on the Big Screen.',
      confirm: 'Confirm'
    }
  },
  board: {
    pageTitle: 'Board View',
    lobby: {
      pageTitle: 'Board Lobby',
      subtitle: 'Select a bar to view its live board.',
      description:
        'Each location streams live prices and event updates—pick a bar below to open its big screen.',
      empty: 'No bars configured yet.',
      openBoard: 'Open board'
    },
    header: { kicker: 'High Contrast Board', title: 'Ticker & Event Command' },
    badges: {
      live: 'live',
      connecting: 'connecting...',
      connected: 'connected'
    },
    ticker: {
      label: 'Live Ticker',
      subTitle: 'Trading floor live board'
    },
    card: {
      priceLabel: 'Current price',
      deltaLabel: 'Delta',
      trendLabel: 'Trend',
      empty: 'Waiting for drinks...'
    },
    trendLabels: {
      up: 'Rising',
      down: 'Falling',
      flat: 'Stable'
    },
    actions: {
      reconnect: 'Reconnect board'
    },
    chart: {
      sectionTitle: 'Prices',
      subTitle: 'Shared curve view per bar',
      chartBadge: 'Live',
      legendTitle: 'Legend',
      button: 'Restart',
      tableHeaders: { metric: 'Metric', value: 'Value' },
      lastUpdated: 'Last updated',
      noTimestamp: '—',
      tooltip: {
        label: 'Latest values',
        empty: 'Waiting for price data'
      },
      pointsLabel: 'Points'
    },
    eventOverlay: {
      label: 'Live Event',
      started: 'Event started',
      ended: 'Event ended',
      idle: 'Waiting for events...',
      live: 'Live Event'
    },
    eventFeed: {
      title: 'Event Feed',
      empty: 'Waiting for events...'
    },
    alert: {
      prefix: 'Events and prices are driven by ',
      eventChannel: 'event.*',
      middle: ' and ',
      priceChannel: 'prices.update',
      suffix: '.'
    },
    connectionStatus: {
      connecting: 'connecting...',
      connected: 'connected',
      reconnecting: 'reconnecting...',
      disconnected: 'offline'
    }
  },
  help: {
    pageTitle: 'Help Center',
    hero: {
      title: 'Understand every corner of the console',
      subtitle:
        'Guides, view overviews, and action references for the Drink Exchange frontend.'
    },
    introParagraphs: [
      'Use the navigation to switch between the user, admin, and board experiences.',
      'Each view streams live data; this page explains how signals, boards, and events are structured so you can act confidently.'
    ],
    learnSections: [
      {
        title: 'Views & perspectives',
        description:
          'Each perspective is tailored for a role. Read the key responsibilities before jumping in.',
        cards: [
          {
            name: 'User view',
            summary:
              'Shows customer-facing insights with live signals, portfolio trends, and approved announcements.',
            actions: [
              {
                label: 'Signals table',
                detail:
                  'Tracks the real-time state of watchlists and trading signals.'
              },
              {
                label: 'Portfolio cards',
                detail: 'Progress bars highlight how drinks stack up over time.'
              }
            ]
          },
          {
            name: 'Admin view',
            summary:
              'Operations cockpit to monitor background jobs and plan live events.',
            actions: [
              {
                label: 'Operations badges',
                detail:
                  'Quick health checks for automated mixers, ledgers, and audits.'
              },
              {
                label: 'Schedule event',
                detail: 'Opens the modal that pushes new events to the board.'
              }
            ]
          },
          {
            name: 'Board view',
            summary:
              'Big screen experience with connectivity status, ticker, and live charts.',
            actions: [
              {
                label: 'Board lobby',
                detail: 'Choose a bar to open its dedicated board stream.'
              },
              {
                label: 'Reconnect board',
                detail: 'Retry the SSE connection if the board goes offline.'
              }
            ]
          }
        ]
      },
      {
        title: 'Actions & events',
        description:
          'Track how actions translate into events and how the UI reacts.',
        cards: [
          {
            name: 'Live event overlay',
            summary:
              'Displays the current event status on the board so everyone sees the latest story.',
            actions: [
              {
                label: 'Event.* channel',
                detail:
                  'Pushes lifecycle events (started, ended, idle) to boards.'
              },
              {
                label: 'Event feed',
                detail:
                  'Streams upcoming and active event titles for quick context.'
              }
            ]
          },
          {
            name: 'Price updates',
            summary:
              'Charts and tickers listen to pricing events to keep every value current.',
            actions: [
              {
                label: 'prices.update channel',
                detail: 'Feeds the line charts with new price points.'
              },
              {
                label: 'Event points',
                detail:
                  'Each price point is tagged with the time and trend indicator.'
              }
            ]
          }
        ]
      },
      {
        title: 'Connectivity & best practices',
        description: 'Keep the big screen stable and ready for events.',
        cards: [
          {
            name: 'Connection states',
            summary:
              'Statuses change between connecting, connected, reconnecting, and disconnected.',
            actions: [
              {
                label: 'Connecting',
                detail:
                  'Occurs while the SSE stream starts or retries automatically.'
              },
              {
                label: 'Reconnect button',
                detail:
                  'Manually restart the stream when automatic retries stall.'
              }
            ]
          },
          {
            name: 'Readiness cues',
            summary:
              'Colors, badges, and alerts signal liveliness across boards and actions.',
            actions: [
              {
                label: 'Live badge',
                detail: 'Confirms the console is streaming data.'
              },
              {
                label: 'Alert banners',
                detail:
                  'Explain where events and price data originate for transparency.'
              }
            ]
          }
        ]
      }
    ],
    footer:
      'Need more help? Check the documentation or reach out to the operations team.'
  }
} as const

const catalog = { de, en } as const

type Catalog = typeof catalog

export type NavigationItem = {
  title: string
  description: string
  path: string
}
export type Locale = keyof Catalog
export type Translation = Catalog[Locale]
export type BoardConnectionStatusKey =
  keyof Translation['board']['connectionStatus']

export const supportedLocales: Locale[] = ['en', 'de']
export const languageCookieName = 'django_language'
export const fallbackLocale: Locale = supportedLocales[0]

export const matchSupportedLocale = (
  value?: string | null
): Locale | undefined => {
  if (!value) {
    return undefined
  }

  const normalized = value.toLowerCase()
  for (const candidate of supportedLocales) {
    const normalizedCandidate = candidate.toLowerCase()
    if (
      normalized === normalizedCandidate ||
      normalized.startsWith(`${normalizedCandidate}-`)
    ) {
      return candidate
    }
  }

  return undefined
}

const getCookieValue = (name: string): string | null => {
  if (!browser) {
    return null
  }

  const match = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${name}=`))

  if (!match) {
    return null
  }

  const [, rawValue] = match.split('=')
  return rawValue ? decodeURIComponent(rawValue) : null
}

const setCookieValue = (name: string, value: string) => {
  if (!browser) {
    return
  }

  const maxAge = 31536000
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAge}; samesite=Lax`
}

const detectNavigatorLocale = (): Locale | undefined => {
  if (!browser) {
    return undefined
  }

  const languages =
    navigator.languages ?? (navigator.language ? [navigator.language] : [])
  for (const language of languages) {
    const supported = matchSupportedLocale(language)
    if (supported) {
      return supported
    }
  }

  return undefined
}

const detectPreferredLocale = (): Locale => {
  if (!browser) {
    return fallbackLocale
  }

  const cookieLocale = matchSupportedLocale(getCookieValue(languageCookieName))
  if (cookieLocale) {
    return cookieLocale
  }

  return detectNavigatorLocale() ?? fallbackLocale
}

export const defaultLocale: Locale = fallbackLocale

export const locale = writable<Locale>(detectPreferredLocale())
export const translations = derived(
  locale,
  ($locale) => catalog[$locale] ?? catalog[defaultLocale]
)

export const persistPreferredLocale = (nextLocale: Locale) => {
  setCookieValue(languageCookieName, nextLocale)
}
