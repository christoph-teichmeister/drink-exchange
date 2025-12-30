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
      {
        title: 'Board-Lobby',
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
        night: '🌙',
        day: '☀️'
      }
    },
    logoutLabel: 'Abmelden'
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
      'Nutze die Navigation links, um zwischen den Board- und Hilfeseiten zu wechseln.'
  },
  board: {
    pageTitle: 'Board View',
    backButton: 'Zurück zum Dashboard',
    backButton: 'Back to dashboard',
    backButton: 'Zurück zum Dashboard',
    lobby: {
      pageTitle: 'Board-Lobby',
      subtitle: 'Wähle eine Bar, um ihr Live-Board aufzurufen.',
      description:
        'Jede Location streamt Live-Preise und Events. Wähle eine Bar aus, um ihr Dashboard zu öffnen.',
      empty: 'Noch keine Bars konfiguriert.',
      openDashboard: 'Dashboard öffnen'
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
      'Nutze die Navigation, um zwischen Board- und Hilfeseiten zu wechseln.',
      'Diese Seite erklärt, wie das Board Events, Preise und Alerts bereitstellt, damit du sicher handelst.'
    ],
    learnSections: [
      {
        title: 'Board-Perspektive',
        description:
          'Das Big Screen-Erlebnis bündelt Ticker, Verbindungen und Events in einer übersichtlichen Konsole.',
        cards: [
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
  },
  auth: {
    login: {
      pageTitle: 'Anmelden',
      headline: 'Willkommen zurück',
      description: 'Melde dich an, um auf deine zugewiesenen Bars zuzugreifen.',
      usernameLabel: 'Benutzername',
      passwordLabel: 'Passwort',
      submitLabel: 'Anmelden',
      helper: 'Nutze dein Drink Exchange Konto, um Dashboards zu öffnen.',
      errors: {
        invalid: 'Ungültiger Benutzername oder Passwort.',
        required: 'Benutzername und Passwort sind erforderlich.',
        general: 'Wir konnten dich gerade nicht anmelden.'
      }
    }
  },
  dashboard: {
    pageTitle: 'Bar-Dashboard',
    description: 'Wähle eine Ansicht für die ausgewählte Bar.',
    actions: {
      board: 'Board-Ansicht öffnen',
      admin: 'Admin-Konsole öffnen'
    },
    logout: 'Abmelden'
  },
  admin: {
    pageTitle: 'Admin-Konsole',
    description: 'Administrative Funktionen für diese Bar folgen bald.',
    emptyState: 'Admin-Tools für diese Bar kommen in Kürze.'
  }
} as const
const en = {
  layout: {
    headerSubtitle: 'Drink Exchange',
    headerTitle: 'Live Engineering Console',
    headerBadge: 'Live',
    navLabel: 'Navigation',
    navToggleLabel: 'Toggle navigation',
    logoutLabel: 'Log out',
    navNow: 'now',
    navItems: [
      {
        title: 'Board Lobby',
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
        night: '🌙',
        day: '☀️'
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
      'Use the navigation on the left to jump between the board and help perspectives.'
  },
  board: {
    pageTitle: 'Board View',
    lobby: {
      pageTitle: 'Board Lobby',
      subtitle: 'Select a bar to view its live board.',
      description:
        'Each location streams live prices and event updates—pick a bar below to open its dashboard.',
      empty: 'No bars configured yet.',
      openDashboard: 'Open dashboard'
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
    backButton: 'Back to dashboard',
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
      'Use the navigation to switch between the board and help experiences.',
      'This page explains how the board streams events, prices, and alerts so you can act confidently.'
    ],
    learnSections: [
      {
        title: 'Board perspective',
        description:
          'The big screen experience bundles ticker data, connections, and events into one console.',
        cards: [
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
  },
  auth: {
    login: {
      pageTitle: 'Sign in',
      headline: 'Welcome back',
      description: 'Log in to access the bars assigned to your account.',
      usernameLabel: 'Username',
      passwordLabel: 'Password',
      submitLabel: 'Sign in',
      helper: 'Use your Drink Exchange credentials to open dashboards.',
      errors: {
        invalid: 'Invalid username or password.',
        required: 'Username and password are required.',
        general: 'We could not sign you in right now.'
      }
    }
  },
  dashboard: {
    pageTitle: 'Bar dashboard',
    description: 'Choose where to continue once a bar is selected.',
    actions: {
      board: 'Open board view',
      admin: 'Open admin console'
    },
    logout: 'Log out'
  },
  admin: {
    pageTitle: 'Admin console',
    description: 'Administrative tools for this bar are coming soon.',
    emptyState: 'Admin options will appear here once enabled.'
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
