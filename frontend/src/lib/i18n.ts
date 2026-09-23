import { getContext, setContext } from 'svelte'
import { derived, writable, type Readable, type Writable } from 'svelte/store'

const en = {
  layout: {
    headerSubtitle: 'Drink Exchange',
    headerTitle: 'Staff console',
    navLabel: 'Navigation',
    navToggleLabel: 'Open navigation',
    navCloseLabel: 'Close navigation',
    logoutLabel: 'Log out',
    navItems: {
      board: { title: 'Bars' },
      help: { title: 'Help' }
    },
    language: {
      label: 'Language',
      options: [
        { code: 'de', label: 'Deutsch' },
        { code: 'en', label: 'English' }
      ]
    },
    colorMode: {
      options: { dark: 'Dark', light: 'Light' },
      switchTo: {
        dark: 'Switch to dark mode',
        light: 'Switch to light mode'
      }
    }
  },
  board: {
    pageTitle: 'Board View',
    terminal: {
      brand: 'Drink Exchange',
      quotes: 'Quotes',
      columns: {
        drink: 'Drink',
        last: 'Last',
        change: 'Chg',
        changePct: 'Chg %',
        trend: 'Trend'
      },
      changeBasis: 'Change vs. base price',
      chart: 'Price history',
      tape: 'Ticker tape',
      event: 'Market event',
      noEvent: 'No active event. Prices drift back to base.',
      endsIn: 'Ends in {time}',
      ended: 'Ended',
      eventLog: 'Event log',
      logEmpty: 'No events yet.',
      logStarted: 'Start',
      logEnded: 'End',
      eventTypes: {
        boom: 'Boom',
        crash: 'Crash',
        focus: 'Focus',
        normalize: 'Normalize',
        unknown: 'Event'
      },
      eventEffects: {
        boom: 'All prices rising',
        crash: 'All prices falling',
        focus: 'Selected drinks in demand',
        normalize: 'Prices returning to base',
        unknown: 'Market is moving'
      },
      status: {
        connecting: 'Connecting',
        connected: 'Live',
        reconnecting: 'Reconnecting',
        offline: 'Offline',
        unauthorized: 'No access'
      },
      stale: 'Stale',
      lastUpdate: 'Updated {time}',
      retryIn: 'Retry in {seconds}s',
      reconnect: 'Reconnect',
      fullscreen: 'Fullscreen',
      exitFullscreen: 'Exit fullscreen',
      exit: 'Leave board'
    },
    lobby: {
      pageTitle: 'Your bars',
      subtitle: 'Bars',
      description:
        'Open the trading desk to book purchases, the board for the big screen, or the admin to configure the market.',
      empty: 'No bars are assigned to your account yet.',
      openDesk: 'Trading desk',
      openBoard: 'Board',
      openAdmin: 'Admin'
    },
    backButton: 'Back to dashboard',
    card: {
      empty: 'Waiting for drinks...'
    },
    chart: {
      ariaLabel: 'Price history chart for all drinks'
    },
    eventOverlay: {
      untitled: 'Unnamed event'
    },
    connection: {
      unauthenticated:
        'Your session has expired. Sign in again to resume live prices.',
      forbidden:
        'Your account is not assigned to this bar, so live prices are unavailable.',
      loginLink: 'Go to sign in'
    }
  },
  help: {
    pageTitle: 'Help',
    title: 'How Drink Exchange works',
    intro:
      'Prices behave like a stock market: purchases push a drink up, the others drop slightly, and every few seconds prices drift back towards their base price. Random market events add extra movement.',
    sections: [
      {
        title: 'Views',
        items: [
          {
            term: 'Bars',
            detail:
              'Lists the bars assigned to your account and opens their desk, board or admin.'
          },
          {
            term: 'Trading desk',
            detail:
              'For staff at the counter: pick a quantity and book a purchase. Prices update immediately for everyone.'
          },
          {
            term: 'Board',
            detail:
              'Full-screen market view for a TV: quotes, ticker tape, chart and the current market event. Use the fullscreen button in its footer.'
          },
          {
            term: 'Admin',
            detail:
              'Links to the configuration of bar settings, drinks, market events and the trade log.'
          }
        ]
      },
      {
        title: 'Prices',
        items: [
          {
            term: 'Change',
            detail:
              'Shown against the base price, the level the market returns to when nobody buys.'
          },
          {
            term: 'Purchases',
            detail:
              'Each unit bought raises the drink by its volatility share of the base price; the other drinks lose part of that, weighted by their weight.'
          },
          {
            term: 'Bounds',
            detail:
              'Prices are rounded to each drink’s step and never leave its minimum and maximum.'
          }
        ]
      },
      {
        title: 'Market events',
        items: [
          {
            term: 'Boom',
            detail: 'All prices are pulled upwards for a while.'
          },
          { term: 'Crash', detail: 'All prices are pulled downwards.' },
          { term: 'Focus', detail: 'Only selected drinks are in demand.' },
          {
            term: 'Countdown',
            detail:
              'The board shows how long the current event lasts; its effect fades out towards the end.'
          }
        ]
      },
      {
        title: 'Connection',
        items: [
          {
            term: 'Live',
            detail: 'Prices arrive in real time.'
          },
          {
            term: 'Reconnecting / Offline',
            detail:
              'The screen retries automatically and marks prices as stale until the connection is back. Bookings on the desk still go through.'
          },
          {
            term: 'No access',
            detail:
              'Your session expired or your account is not assigned to this bar. Sign in again.'
          }
        ]
      }
    ]
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
    pageTitle: 'Trading desk',
    subtitle: 'Book purchases; prices react immediately.',
    quotes: 'Drinks',
    book: 'Book',
    bookLabel: 'Book {qty} × {drink}',
    qtyLabel: 'Quantity for {drink}',
    decrease: 'Decrease quantity',
    increase: 'Increase quantity',
    booked: '{qty} × {drink} booked · {before} → {after}',
    recent: 'Recent bookings',
    recentEmpty: 'No bookings in this session yet.',
    staleNotice:
      'Live prices are paused. Bookings still work; prices refresh after each booking.',
    openBoard: 'Open board',
    openAdmin: 'Admin',
    errors: {
      general: 'The booking failed. Please try again.',
      network: 'No connection to the server. Please try again.',
      session: 'Your session expired. Sign in again to book.',
      forbidden: 'Your account is not assigned to this bar.'
    }
  },
  admin: {
    pageTitle: 'Admin',
    description:
      'Configure this bar’s market. Changes to drinks take effect on the board and desk immediately.',
    openDesk: 'Trading desk',
    actions: { save: 'Save', delete: 'Delete' },
    feedback: {
      saved: 'Saved.',
      created: 'Created.',
      invalid: 'Please correct the highlighted fields.',
      failed: 'Saving failed. Please try again.',
      network: 'No connection to the server. Please try again.',
      session: 'Your session expired. Sign in again.',
      forbidden: 'Only bar managers can change the market configuration.'
    },
    validation: {
      required: 'Required.',
      number: 'Enter a number.',
      integer: 'Enter a whole number.'
    },
    settings: {
      title: 'Bar settings',
      hint: 'Reversion pulls prices back towards the base price on every tick; impulse and normalization control how strongly purchases move prices.',
      fields: {
        name: 'Name',
        description: 'Description',
        tick: 'Tick interval (s)',
        reversion: 'Reversion rate (0–1)',
        impulse: 'Purchase impulse',
        normalization: 'Normalization (0–1)',
        retention: 'Record history every n ticks'
      }
    },
    drinks: {
      title: 'Drinks',
      hint: 'Volatility is the share of the base price one purchase adds; weight controls how much a drink drops when others are bought.',
      newTitle: 'New drink',
      add: 'Add drink',
      confirmDelete: 'Delete “{name}”?',
      hasTrades: 'Has bookings, cannot be deleted',
      fields: {
        name: 'Name',
        base: 'Base price',
        min: 'Minimum',
        max: 'Maximum',
        step: 'Rounding step',
        volatility: 'Volatility',
        weight: 'Weight'
      }
    },
    events: {
      title: 'Market events',
      hint: 'A random event starts based on its weight; its multiplier fades back to 1 over the duration.',
      newTitle: 'New event',
      add: 'Add event',
      confirmDelete: 'Delete “{name}”?',
      fields: {
        name: 'Name',
        type: 'Type',
        weight: 'Weight',
        duration: 'Duration (s)',
        cooldown: 'Cooldown (s)',
        multiplier: 'Start multiplier',
        description: 'Description',
        targets: 'Drinks in focus'
      }
    },
    advanced: {
      title: 'Advanced',
      hint: 'Users, bar assignments and the full booking log are managed in the Django admin.',
      links: {
        bar: 'Bars',
        drinks: 'Drinks',
        events: 'Event definitions',
        trades: 'Trades'
      }
    }
  },
  errors: {
    barsUnavailable: 'Your assigned bars could not be loaded.',
    barNotFound: 'This bar does not exist or is not assigned to you.',
    managerRequired: 'Only bar managers can open the admin area.',
    configUnavailable: 'The market configuration could not be loaded.',
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
    headerTitle: 'Staff-Konsole',
    navLabel: 'Navigation',
    navToggleLabel: 'Navigation öffnen',
    navCloseLabel: 'Navigation schließen',
    logoutLabel: 'Abmelden',
    navItems: {
      board: { title: 'Bars' },
      help: { title: 'Hilfe' }
    },
    language: {
      label: 'Sprache',
      options: [
        { code: 'de', label: 'Deutsch' },
        { code: 'en', label: 'English' }
      ]
    },
    colorMode: {
      options: { dark: 'Dunkel', light: 'Hell' },
      switchTo: {
        dark: 'Zum dunklen Design wechseln',
        light: 'Zum hellen Design wechseln'
      }
    }
  },
  board: {
    pageTitle: 'Board View',
    terminal: {
      brand: 'Drink Exchange',
      quotes: 'Kurse',
      columns: {
        drink: 'Getränk',
        last: 'Kurs',
        change: 'Änd.',
        changePct: 'Änd. %',
        trend: 'Verlauf'
      },
      changeBasis: 'Änderung ggü. Basispreis',
      chart: 'Kursverlauf',
      tape: 'Laufband',
      event: 'Marktereignis',
      noEvent: 'Kein aktives Ereignis. Preise laufen zum Basispreis zurück.',
      endsIn: 'Endet in {time}',
      ended: 'Beendet',
      eventLog: 'Ereignisprotokoll',
      logEmpty: 'Noch keine Ereignisse.',
      logStarted: 'Start',
      logEnded: 'Ende',
      eventTypes: {
        boom: 'Boom',
        crash: 'Crash',
        focus: 'Fokus',
        normalize: 'Normalisierung',
        unknown: 'Ereignis'
      },
      eventEffects: {
        boom: 'Alle Preise steigen',
        crash: 'Alle Preise fallen',
        focus: 'Ausgewählte Getränke gefragt',
        normalize: 'Preise kehren zum Basispreis zurück',
        unknown: 'Der Markt bewegt sich'
      },
      status: {
        connecting: 'Verbinde',
        connected: 'Live',
        reconnecting: 'Verbinde neu',
        offline: 'Offline',
        unauthorized: 'Kein Zugriff'
      },
      stale: 'Veraltet',
      lastUpdate: 'Stand {time}',
      retryIn: 'Neuer Versuch in {seconds} s',
      reconnect: 'Neu verbinden',
      fullscreen: 'Vollbild',
      exitFullscreen: 'Vollbild beenden',
      exit: 'Board verlassen'
    },
    lobby: {
      pageTitle: 'Deine Bars',
      subtitle: 'Bars',
      description:
        'Öffne den Trading-Desk zum Buchen von Käufen, das Board für den großen Bildschirm oder den Admin-Bereich zur Konfiguration des Markts.',
      empty: 'Deinem Konto sind noch keine Bars zugewiesen.',
      openDesk: 'Trading-Desk',
      openBoard: 'Board',
      openAdmin: 'Admin'
    },
    backButton: 'Zurück zum Dashboard',
    card: {
      empty: 'Warten auf Drinks...'
    },
    chart: {
      ariaLabel: 'Preisverlauf aller Drinks'
    },
    eventOverlay: {
      untitled: 'Unbenanntes Event'
    },
    connection: {
      unauthenticated:
        'Deine Sitzung ist abgelaufen. Melde dich erneut an, um Live-Preise zu sehen.',
      forbidden:
        'Dein Konto ist dieser Bar nicht zugewiesen, daher sind keine Live-Preise verfügbar.',
      loginLink: 'Zur Anmeldung'
    }
  },
  help: {
    pageTitle: 'Hilfe',
    title: 'So funktioniert Drink Exchange',
    intro:
      'Die Preise verhalten sich wie an der Börse: Käufe treiben ein Getränk nach oben, die anderen fallen leicht, und alle paar Sekunden laufen die Preise zum Basispreis zurück. Zufällige Marktereignisse sorgen für zusätzliche Bewegung.',
    sections: [
      {
        title: 'Ansichten',
        items: [
          {
            term: 'Bars',
            detail:
              'Zeigt die Bars deines Kontos und öffnet deren Desk, Board oder Admin-Bereich.'
          },
          {
            term: 'Trading-Desk',
            detail:
              'Für den Tresen: Menge wählen und Kauf buchen. Die Preise ändern sich sofort für alle.'
          },
          {
            term: 'Board',
            detail:
              'Vollbild-Marktansicht für den Fernseher: Kurse, Laufband, Chart und das aktuelle Marktereignis. Vollbild über den Knopf in der Fußzeile.'
          },
          {
            term: 'Admin',
            detail:
              'Links zur Konfiguration von Bar-Einstellungen, Getränken, Marktereignissen und zum Buchungsprotokoll.'
          }
        ]
      },
      {
        title: 'Preise',
        items: [
          {
            term: 'Änderung',
            detail:
              'Bezogen auf den Basispreis – das Niveau, zu dem der Markt ohne Käufe zurückkehrt.'
          },
          {
            term: 'Käufe',
            detail:
              'Jede gekaufte Einheit hebt das Getränk um seinen Volatilitätsanteil am Basispreis; die anderen verlieren einen Teil davon, gewichtet nach ihrem Gewicht.'
          },
          {
            term: 'Grenzen',
            detail:
              'Preise werden auf die Schrittweite des Getränks gerundet und verlassen nie Minimum und Maximum.'
          }
        ]
      },
      {
        title: 'Marktereignisse',
        items: [
          {
            term: 'Boom',
            detail: 'Alle Preise werden eine Zeit lang nach oben gezogen.'
          },
          { term: 'Crash', detail: 'Alle Preise werden nach unten gezogen.' },
          { term: 'Fokus', detail: 'Nur ausgewählte Getränke sind gefragt.' },
          {
            term: 'Countdown',
            detail:
              'Das Board zeigt, wie lange das Ereignis noch läuft; seine Wirkung klingt zum Ende hin ab.'
          }
        ]
      },
      {
        title: 'Verbindung',
        items: [
          {
            term: 'Live',
            detail: 'Preise kommen in Echtzeit an.'
          },
          {
            term: 'Verbinde neu / Offline',
            detail:
              'Der Bildschirm versucht es automatisch erneut und markiert Preise als veraltet, bis die Verbindung steht. Buchungen am Desk funktionieren trotzdem.'
          },
          {
            term: 'Kein Zugriff',
            detail:
              'Deine Sitzung ist abgelaufen oder dein Konto ist dieser Bar nicht zugewiesen. Melde dich erneut an.'
          }
        ]
      }
    ]
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
    pageTitle: 'Trading-Desk',
    subtitle: 'Käufe buchen, die Preise reagieren sofort.',
    quotes: 'Getränke',
    book: 'Buchen',
    bookLabel: '{qty} × {drink} buchen',
    qtyLabel: 'Menge für {drink}',
    decrease: 'Menge verringern',
    increase: 'Menge erhöhen',
    booked: '{qty} × {drink} gebucht · {before} → {after}',
    recent: 'Letzte Buchungen',
    recentEmpty: 'In dieser Sitzung noch keine Buchungen.',
    staleNotice:
      'Live-Preise pausieren. Buchen funktioniert weiter; die Preise aktualisieren sich nach jeder Buchung.',
    openBoard: 'Board öffnen',
    openAdmin: 'Admin',
    errors: {
      general: 'Die Buchung ist fehlgeschlagen. Bitte erneut versuchen.',
      network: 'Keine Verbindung zum Server. Bitte erneut versuchen.',
      session: 'Deine Sitzung ist abgelaufen. Melde dich zum Buchen erneut an.',
      forbidden: 'Dein Konto ist dieser Bar nicht zugewiesen.'
    }
  },
  admin: {
    pageTitle: 'Admin',
    description:
      'Konfiguriere den Markt dieser Bar. Änderungen an Getränken wirken sofort auf Board und Desk.',
    openDesk: 'Trading-Desk',
    actions: { save: 'Speichern', delete: 'Löschen' },
    feedback: {
      saved: 'Gespeichert.',
      created: 'Angelegt.',
      invalid: 'Bitte die markierten Felder korrigieren.',
      failed: 'Speichern fehlgeschlagen. Bitte erneut versuchen.',
      network: 'Keine Verbindung zum Server. Bitte erneut versuchen.',
      session: 'Deine Sitzung ist abgelaufen. Melde dich erneut an.',
      forbidden: 'Nur Bar-Manager können die Marktkonfiguration ändern.'
    },
    validation: {
      required: 'Pflichtfeld.',
      number: 'Bitte eine Zahl eingeben.',
      integer: 'Bitte eine ganze Zahl eingeben.'
    },
    settings: {
      title: 'Bar-Einstellungen',
      hint: 'Die Rückkehrrate zieht die Preise bei jedem Tick zum Basispreis zurück; Impuls und Normalisierung steuern, wie stark Käufe die Preise bewegen.',
      fields: {
        name: 'Name',
        description: 'Beschreibung',
        tick: 'Tick-Intervall (s)',
        reversion: 'Rückkehrrate (0–1)',
        impulse: 'Kauf-Impuls',
        normalization: 'Normalisierung (0–1)',
        retention: 'Verlauf alle n Ticks speichern'
      }
    },
    drinks: {
      title: 'Getränke',
      hint: 'Die Volatilität ist der Anteil am Basispreis, den ein Kauf aufschlägt; das Gewicht bestimmt, wie stark ein Getränk fällt, wenn andere gekauft werden.',
      newTitle: 'Neues Getränk',
      add: 'Getränk anlegen',
      confirmDelete: '„{name}“ löschen?',
      hasTrades: 'Hat Buchungen, kann nicht gelöscht werden',
      fields: {
        name: 'Name',
        base: 'Basispreis',
        min: 'Minimum',
        max: 'Maximum',
        step: 'Rundungsschritt',
        volatility: 'Volatilität',
        weight: 'Gewicht'
      }
    },
    events: {
      title: 'Marktereignisse',
      hint: 'Ein zufälliges Ereignis startet gemäß seinem Gewicht; sein Multiplikator klingt über die Dauer auf 1 ab.',
      newTitle: 'Neues Ereignis',
      add: 'Ereignis anlegen',
      confirmDelete: '„{name}“ löschen?',
      fields: {
        name: 'Name',
        type: 'Typ',
        weight: 'Gewichtung',
        duration: 'Dauer (s)',
        cooldown: 'Abklingzeit (s)',
        multiplier: 'Start-Multiplikator',
        description: 'Beschreibung',
        targets: 'Getränke im Fokus'
      }
    },
    advanced: {
      title: 'Erweitert',
      hint: 'Benutzer, Bar-Zuordnungen und das vollständige Buchungsprotokoll werden im Django-Admin verwaltet.',
      links: {
        bar: 'Bars',
        drinks: 'Getränke',
        events: 'Ereignis-Definitionen',
        trades: 'Buchungen'
      }
    }
  },
  errors: {
    barsUnavailable: 'Deine zugewiesenen Bars konnten nicht geladen werden.',
    barNotFound: 'Diese Bar existiert nicht oder ist dir nicht zugewiesen.',
    managerRequired: 'Nur Bar-Manager können den Admin-Bereich öffnen.',
    configUnavailable: 'Die Marktkonfiguration konnte nicht geladen werden.',
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
