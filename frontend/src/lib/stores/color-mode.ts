import { browser } from '$app/environment'
import { writable } from 'svelte/store'

export type ColorMode = 'light' | 'dark'

const STORAGE_KEY = 'drink-exchange-color-mode'

const resolveInitialMode = (): ColorMode => {
  if (!browser) {
    return 'dark'
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  // Dark is the product default (matching the big-screen board); light is opt-in.
  return 'dark'
}

const applyColorMode = (mode: ColorMode) => {
  if (!browser) {
    return
  }

  const root = document.documentElement
  root.setAttribute('data-theme', mode)
  root.classList.toggle('dark', mode === 'dark')
  root.classList.toggle('light', mode === 'light')
  localStorage.setItem(STORAGE_KEY, mode)
}

export const colorMode = writable<ColorMode>(resolveInitialMode())

if (browser) {
  colorMode.subscribe((mode) => {
    applyColorMode(mode)
  })
}

// Only ever called from browser event handlers, so the module-level store is
// never written during SSR (where it stays at its constant default).
export const setColorMode = (mode: ColorMode) => {
  colorMode.set(mode)
}
