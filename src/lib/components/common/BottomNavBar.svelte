<script lang="ts">
  import { page } from '$app/state';

  const NAV_ITEMS = [
    { href: '/', icon: 'home', label: 'Beranda' },
    { href: '/tambah', icon: 'add_circle', label: 'Tambah' },
    { href: '/riwayat', icon: 'history', label: 'Riwayat' },
    { href: '/profil', icon: 'person', label: 'Profil' },
  ];

  let currentPath = $derived(page.url.pathname);
</script>

<nav class="fixed bottom-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-t border-outline-variant/10">
  <div class="flex justify-around items-center px-1 pt-1 pb-2 max-w-2xl mx-auto">
    {#each NAV_ITEMS as { href, icon, label } (href)}
      {@const isActive = currentPath === href}
      <a
        {href}
        class="relative flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all duration-200 active:scale-95"
        aria-current={isActive ? 'page' : undefined}
      >
        <span
          class="relative flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200 {isActive ? 'bg-primary/12' : ''}"
        >
          <span
            class="material-symbols-outlined transition-all duration-200 {isActive ? 'text-primary' : 'text-on-surface-variant/50'}"
            style="font-size: 22px; font-variation-settings: {isActive ? `'FILL' 1, 'wght' 500` : `'FILL' 0, 'wght' 300`};"
          >
            {icon}
          </span>
        </span>

        <span
          class="text-[10px] tracking-wide transition-all duration-200 {isActive ? 'font-semibold text-primary' : 'font-medium text-on-surface-variant/50'}"
        >
          {label}
        </span>
      </a>
    {/each}
  </div>
</nav>

