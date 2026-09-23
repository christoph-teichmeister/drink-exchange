<script lang="ts">
  import { resolve } from '$app/paths'
  import { getI18nContext } from '$lib/i18n'

  let {
    currentPath = '/',
    orientation = 'vertical',
    onChoose = () => {}
  }: {
    currentPath?: string
    orientation?: 'horizontal' | 'vertical'
    onChoose?: () => void
  } = $props()

  const { translations } = getI18nContext()

  const routes = [
    { key: 'board', href: resolve('/board') },
    { key: 'help', href: resolve('/help') }
  ] as const

  // Bar pages (desk, admin) live under the bars section.
  const isActive = (href: string) =>
    currentPath === href ||
    (href === resolve('/board') &&
      (currentPath.startsWith('/dashboard/') ||
        currentPath.startsWith('/admin/')))
</script>

<ul
  class={orientation === 'horizontal'
    ? 'flex items-center gap-1'
    : 'mt-3 flex flex-col gap-1'}
>
  {#each routes as route (route.key)}
    {@const active = isActive(route.href)}
    <li>
      <a
        href={route.href}
        aria-current={active ? 'page' : undefined}
        class={`block rounded-sm px-3 py-2 text-sm transition-colors ${
          active
            ? 'bg-ui-raised font-semibold text-ui-text'
            : 'text-ui-muted hover:text-ui-text'
        }`}
        onclick={onChoose}
      >
        {$translations.layout.navItems[route.key].title}
      </a>
    </li>
  {/each}
</ul>
