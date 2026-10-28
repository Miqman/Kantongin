<script lang="ts">
  interface NavItem {
    name: string;
    link: string;
  }

  const navItems: NavItem[] = [
    { name: 'Fitur', link: '#fitur' },
    { name: 'Keamanan', link: '#keamanan' },
    { name: 'FAQ', link: '#faq' },
  ];

  let scrollY = $state(0);
  let isMobileMenuOpen = $state(false);
  let hoveredIndex = $state<number | null>(null);

  const isScrolled = $derived(scrollY > 50);

  function closeMobileMenu() {
    isMobileMenuOpen = false;
  }
</script>

<svelte:window bind:scrollY={scrollY} />

<!-- Sticky / Fixed Navbar Container -->
<header
  class="fixed inset-x-0 top-0 z-50 w-full pointer-events-none transition-all duration-300 ease-out {isScrolled
    ? 'pt-3 sm:pt-4'
    : 'pt-2 sm:pt-4'}"
>
  <!-- Desktop Nav (Hidden on Mobile) -->
  <nav
    class="pointer-events-auto mx-auto hidden lg:flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] {isScrolled
      ? 'w-auto max-w-3xl rounded-full border border-white/10 bg-zinc-950/80 px-4 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl'
      : 'w-full max-w-7xl px-6 py-4 bg-transparent border-transparent'}"
  >
    <!-- Brand Logo -->
    <a href="/landing" class="flex items-center gap-2.5 group flex-shrink-0">
      <img
        src="/android-chrome-192x192.png"
        alt="Logo Uangmu"
        class="w-8 h-8 rounded-xl object-contain shadow-md shadow-black/40 group-hover:scale-105 transition-transform"
      />
      <div class="flex flex-col">
        <span class="font-headline font-extrabold text-sm tracking-tight text-white leading-none">
          Uangmu
        </span>
        <span class="text-[9px] text-zinc-400 font-semibold tracking-wider uppercase">Finance AI</span>
      </div>
    </a>

    <!-- Navigation Items with Animated Hover Pill -->
    <div class="relative flex items-center gap-1 px-3">
      {#each navItems as item, idx}
        <a
          href={item.link}
          onmouseenter={() => (hoveredIndex = idx)}
          onmouseleave={() => (hoveredIndex = null)}
          class="relative px-4 py-1.5 text-xs font-medium text-zinc-300 transition-colors duration-200 hover:text-white"
        >
          {#if hoveredIndex === idx}
            <span
              class="absolute inset-0 -z-10 rounded-full bg-white/10 backdrop-blur-md transition-all duration-200"
            ></span>
          {/if}
          <span>{item.name}</span>
        </a>
      {/each}
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center gap-2.5 flex-shrink-0">
      <a
        href="/login"
        class="text-xs font-semibold text-zinc-300 hover:text-white px-3 py-1.5 transition-colors cursor-pointer"
      >
        Masuk
      </a>
      <a
        href="/"
        class="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-zinc-200 transition-all shadow-md active:scale-95 cursor-pointer"
      >
        <span>Buka Dashboard</span>
        <span class="material-symbols-outlined text-xs">arrow_forward</span>
      </a>
    </div>
  </nav>

  <!-- Mobile Nav (Hidden on Desktop) -->
  <div
    class="pointer-events-auto mx-auto w-full px-4 lg:hidden transition-all duration-300 ease-out"
  >
    <div
      class="flex items-center justify-between transition-all duration-300 {isScrolled
        ? 'w-full rounded-2xl border border-white/10 bg-zinc-950/85 px-4 py-2.5 shadow-2xl backdrop-blur-xl'
        : 'w-full px-2 py-3 bg-transparent'}"
    >
      <!-- Mobile Logo -->
      <a href="/landing" class="flex items-center gap-2">
        <img
          src="/android-chrome-192x192.png"
          alt="Logo Uangmu"
          class="w-7 h-7 rounded-lg object-contain"
        />
        <span class="font-headline font-bold text-sm text-white">Uangmu</span>
      </a>

      <!-- Mobile Toggle Button -->
      <button
        type="button"
        onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
        class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 cursor-pointer"
        aria-label="Toggle navigation menu"
      >
        <span class="material-symbols-outlined text-xl">
          {isMobileMenuOpen ? 'close' : 'menu'}
        </span>
      </button>
    </div>

    <!-- Mobile Dropdown Menu -->
    {#if isMobileMenuOpen}
      <div
        class="mt-2 flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-950/95 p-5 shadow-2xl backdrop-blur-2xl animate-fade-in"
      >
        <div class="flex flex-col gap-1 pb-3 border-b border-white/10">
          {#each navItems as item}
            <a
              href={item.link}
              onclick={closeMobileMenu}
              class="px-3 py-2 text-sm font-medium text-zinc-300 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
            >
              {item.name}
            </a>
          {/each}
        </div>

        <div class="flex flex-col gap-2 pt-1">
          <a
            href="/login"
            onclick={closeMobileMenu}
            class="w-full text-center py-2.5 text-xs font-semibold text-zinc-300 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            Masuk ke Akun
          </a>
          <a
            href="/"
            onclick={closeMobileMenu}
            class="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-zinc-950 bg-white rounded-xl hover:bg-zinc-200 transition-colors shadow-md"
          >
            <span>Buka Dashboard</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>
      </div>
    {/if}
  </div>
</header>

