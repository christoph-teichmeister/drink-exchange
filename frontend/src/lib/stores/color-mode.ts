import { browser } from '$app/environment'
import { writable } from 'svelte/store'

export type ColorMode = 'light' | 'dark'

const STORAGE_KEY = 'drink-exchange-color-mode'

const getPreferredMode = (): ColorMode =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const resolveInitialMode = (): ColorMode => {
  if (!browser) {
    return 'dark'
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return getPreferredMode()
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

export const setColorMode = (mode: ColorMode) => {
  colorMode.set(mode)
}

export const toggleColorMode = () => {
  colorMode.update((current) => (current === 'dark' ? 'light' : 'dark'))
}
