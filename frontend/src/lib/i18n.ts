import { derived, writable } from 'svelte/store'

const de = {
  layout: {
    headerSubtitle: 'Drink Exchange',
    headerTitle: 'Live Engineering Console',
    headerBadge: 'Live',
    navLabel: 'Navigation',
    navNow: 'jetzt',
    navItems: [
      { title: 'User', description: 'Individuelle Dashboards', path: '/user' },
      { title: 'Admin', description: 'Operations-Cockpit', path: '/admin' },
      { title: 'Board', description: 'Big Screen & Events', path: '/board' }
    ]
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
    header: { kicker: 'High Contrast Board', title: 'Ticker & Event Command' },
    badges: {
      live: 'live',
      connecting: 'verbindet...',
      connected: 'verbunden'
    },
    chart: {
      sectionTitle: 'Preise',
      button: 'Neustart',
      tableHeaders: { metric: 'Metrik', value: 'Wert' }
    },
    noEvents: 'Warten auf das nächste Event...',
    alert: {
      prefix: 'Events und Preise werden über ',
      eventChannel: 'event.*',
      middle: ' und ',
      priceChannel: 'prices.update',
      suffix: ' gesteuert.'
    },
    connectionStatus: { connecting: 'verbindet...', connected: 'verbunden' }
  }
} as const

const en = {
  layout: {
    headerSubtitle: 'Drink Exchange',
    headerTitle: 'Live Engineering Console',
    headerBadge: 'Live',
    navLabel: 'Navigation',
    navNow: 'now',
    navItems: [
      { title: 'User', description: 'Individual dashboards', path: '/user' },
      { title: 'Admin', description: 'Operations cockpit', path: '/admin' },
      { title: 'Board', description: 'Big screen & events', path: '/board' }
    ]
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
    header: { kicker: 'High Contrast Board', title: 'Ticker & Event Command' },
    badges: {
      live: 'live',
      connecting: 'connecting...',
      connected: 'connected'
    },
    chart: {
      sectionTitle: 'Prices',
      button: 'Restart',
      tableHeaders: { metric: 'Metric', value: 'Value' }
    },
    noEvents: 'Waiting for the next event...',
    alert: {
      prefix: 'Events and prices are driven by ',
      eventChannel: 'event.*',
      middle: ' and ',
      priceChannel: 'prices.update',
      suffix: '.'
    },
    connectionStatus: { connecting: 'connecting...', connected: 'connected' }
  }
} as const

const catalog = { de, en } as const

type Catalog = typeof catalog

export type Locale = keyof Catalog
export type Translation = Catalog[Locale]
export type BoardConnectionStatusKey =
  keyof Translation['board']['connectionStatus']

export const defaultLocale: Locale = 'de'

export const locale = writable<Locale>(defaultLocale)
export const translations = derived(
  locale,
  ($locale) => catalog[$locale] ?? catalog[defaultLocale]
)
