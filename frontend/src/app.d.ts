import type { Locale } from '$lib/i18n'

declare global {
  namespace App {
    interface Locals {
      locale: Locale
    }
  }

  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string
    readonly VITE_API_INTERNAL_BASE_URL?: string
    readonly VITE_WS_BASE_URL?: string
  }
}

export {}
