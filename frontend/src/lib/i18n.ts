import { getContext, setContext } from 'svelte'
import { derived, writable, type Readable, type Writable } from 'svelte/store'

const en = {
  layout: {
    headerSubtitle: 'Drink Exchange',
    headerTitle: 'Live Engineering Console',
    headerBadge: 'Live',
    navLabel: 'Navigation',
    navToggleLabel: 'Toggle navigation',
    navCloseLabel: 'Close navigation',
    logoutLabel: 'Log out',
    navNow: 'now',
    navItems: {
      board: {
        title: 'Board Lobby',
        description: 'Big screen & events'
      },
      help: {
        title: 'Help',
        description: 'Guides & overview'
      }
    },
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
      },
      labels: {
        night: 'Dark mode',
        day: 'Light mode'
      }
    }
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
      live: 'live'
    },
    ticker: {
      label: 'Live Ticker',
      subTitle: 'Trading floor live board'
    },
    card: {
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
      lastUpdated: 'Last updated',
      noTimestamp: '—',
      ariaLabel: 'Price history chart for all drinks'
    },
    eventOverlay: {
      started: 'Event started',
      ended: 'Event ended',
      idle: 'Waiting for events...',
      live: 'Live Event',
      untitled: 'Unnamed event'
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
      offline: 'offline',
      unauthorized: 'no access'
    },
    connection: {
      staleNotice: 'Live connection lost — prices shown may be outdated.',
      lastUpdate: 'Last update: {time}',
      reconnectingDetail: 'Attempt {attempt} · next try in {seconds}s',
      reconnectingNow: 'Attempt {attempt} · connecting now',
      offlineDetail:
        'Your device is offline. The board reconnects automatically once the network is back.',
      unauthenticated:
        'Your session has expired. Sign in again to resume live prices.',
      forbidden:
        'Your account is not assigned to this bar, so live prices are unavailable.',
      loginLink: 'Go to sign in'
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
                detail:
                  'Retry the WebSocket connection if the board goes offline.'
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
              'Statuses change between connecting, connected, reconnecting, offline, and no access.',
            actions: [
              {
                label: 'Reconnecting',
                detail:
                  'The board retries automatically with increasing delays and marks prices as outdated meanwhile.'
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
      description: 'Log in to access the bars assigned to your account.',
      usernameLabel: 'Username',
      passwordLabel: 'Password',
      submitLabel: 'Sign in',
      helper: 'Use your Drink Exchange credentials to open dashboards.',
      errors: {
        invalid: 'Invalid username or password.',
        required: 'Username and password are required.',
        disabled: 'This account is disabled.',
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
  },
  errors: {
    barsUnavailable: 'Your assigned bars could not be loaded.',
    barNotFound: 'This bar does not exist or is not assigned to you.',
    snapshotUnavailable: 'The market snapshot could not be loaded.',
    backendUnreachable: 'The Drink Exchange backend is currently unreachable.'
  }
} as const

// Recursively widens literal types so every locale must provide exactly the
// same key structure as the English reference catalog.
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : { readonly [K in keyof T]: Widen<T[K]> }

export type Translation = Widen<typeof en>

const de: Translation = {
  layout: {
    headerSubtitle: 'Drink Exchange',
    headerTitle: 'Live Engineering Console',
    headerBadge: 'Live',
    navLabel: 'Navigation',
    navToggleLabel: 'Navigation umschalten',
    navCloseLabel: 'Navigation schließen',
    logoutLabel: 'Abmelden',
    navNow: 'jetzt',
    navItems: {
      board: {
        title: 'Board-Lobby',
        description: 'Big Screen & Events'
      },
      help: {
        title: 'Hilfe',
        description: 'Anleitungen & Überblick'
      }
    },
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
      },
      labels: {
        night: 'Dunkler Modus',
        day: 'Heller Modus'
      }
    }
  },
  board: {
    pageTitle: 'Board View',
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
      live: 'live'
    },
    ticker: {
      label: 'Live-Ticker',
      subTitle: 'Trading Floor Live-Board'
    },
    card: {
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
    backButton: 'Zurück zum Dashboard',
    chart: {
      sectionTitle: 'Preise',
      subTitle: 'Gemeinsame Kurvenansicht pro Bar',
      chartBadge: 'Live',
      legendTitle: 'Legende',
      lastUpdated: 'Letztes Update',
      noTimestamp: '—',
      ariaLabel: 'Preisverlauf aller Drinks'
    },
    eventOverlay: {
      started: 'Event gestartet',
      ended: 'Event beendet',
      idle: 'Warten auf Events...',
      live: 'Live Event',
      untitled: 'Unbenanntes Event'
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
      offline: 'offline',
      unauthorized: 'kein Zugriff'
    },
    connection: {
      staleNotice:
        'Live-Verbindung unterbrochen – angezeigte Preise sind möglicherweise veraltet.',
      lastUpdate: 'Letztes Update: {time}',
      reconnectingDetail: 'Versuch {attempt} · nächster Versuch in {seconds} s',
      reconnectingNow: 'Versuch {attempt} · verbindet jetzt',
      offlineDetail:
        'Dein Gerät ist offline. Das Board verbindet sich automatisch, sobald das Netzwerk wieder da ist.',
      unauthenticated:
        'Deine Sitzung ist abgelaufen. Melde dich erneut an, um Live-Preise zu sehen.',
      forbidden:
        'Dein Konto ist dieser Bar nicht zugewiesen, daher sind keine Live-Preise verfügbar.',
      loginLink: 'Zur Anmeldung'
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
                  'Startet die WebSocket-Verbindung neu, wenn das Board offline geht.'
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
              'Status wechselt zwischen verbindet, verbunden, verbindet neu, offline und kein Zugriff.',
            actions: [
              {
                label: 'Verbindet neu',
                detail:
                  'Das Board versucht es automatisch mit wachsenden Abständen erneut und markiert Preise solange als veraltet.'
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
      description: 'Melde dich an, um auf deine zugewiesenen Bars zuzugreifen.',
      usernameLabel: 'Benutzername',
      passwordLabel: 'Passwort',
      submitLabel: 'Anmelden',
      helper: 'Nutze dein Drink Exchange Konto, um Dashboards zu öffnen.',
      errors: {
        invalid: 'Ungültiger Benutzername oder Passwort.',
        required: 'Benutzername und Passwort sind erforderlich.',
        disabled: 'Dieses Konto ist deaktiviert.',
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
  },
  errors: {
    barsUnavailable: 'Deine zugewiesenen Bars konnten nicht geladen werden.',
    barNotFound: 'Diese Bar existiert nicht oder ist dir nicht zugewiesen.',
    snapshotUnavailable: 'Der Markt-Snapshot konnte nicht geladen werden.',
    backendUnreachable:
      'Das Drink Exchange Backend ist gerade nicht erreichbar.'
  }
}

export const catalog = { en, de } as const satisfies Record<string, Translation>

export type Locale = keyof typeof catalog

export const supportedLocales: readonly Locale[] = ['en', 'de']
export const languageCookieName = 'django_language'
export const fallbackLocale: Locale = 'en'

export const matchSupportedLocale = (
  value?: string | null
): Locale | undefined => {
  if (!value) {
    return undefined
  }

  const normalized = value.trim().toLowerCase()
  return supportedLocales.find(
    (candidate) =>
      normalized === candidate || normalized.startsWith(`${candidate}-`)
  )
}

export const parseAcceptLanguage = (
  value?: string | null
): Locale | undefined => {
  if (!value) {
    return undefined
  }

  for (const fragment of value.split(',')) {
    const [langPart] = fragment.split(';')
    const candidate = matchSupportedLocale(langPart)
    if (candidate) {
      return candidate
    }
  }

  return undefined
}

export const getTranslations = (locale: Locale): Translation =>
  catalog[locale] ?? catalog[fallbackLocale]

// Replaces `{name}` placeholders in a catalog string with the given values.
export const interpolate = (
  template: string,
  values: Record<string, string | number>
): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  )

export type I18nContext = {
  locale: Writable<Locale>
  translations: Readable<Translation>
}

const I18N_CONTEXT_KEY = Symbol('i18n')

// Creates the per-request (SSR) or per-app (browser) i18n state. It must be
// provided through context instead of a module-level store, otherwise
// concurrent SSR requests would share and overwrite each other's locale.
export const createI18n = (initialLocale: Locale): I18nContext => {
  const locale = writable<Locale>(initialLocale)
  const translations = derived(locale, ($locale) => getTranslations($locale))
  return { locale, translations }
}

export const setI18nContext = (context: I18nContext) =>
  setContext(I18N_CONTEXT_KEY, context)

export const getI18nContext = (): I18nContext => {
  const context = getContext<I18nContext | undefined>(I18N_CONTEXT_KEY)
  if (!context) {
    throw new Error('i18n context is missing; is the root layout mounted?')
  }
  return context
}

export const persistPreferredLocale = (nextLocale: Locale) => {
  if (typeof document === 'undefined') {
    return
  }

  const maxAge = 31536000
  document.cookie = `${languageCookieName}=${encodeURIComponent(
    nextLocale
  )}; path=/; max-age=${maxAge}; samesite=Lax`
}
