<script lang="ts">
  import { themeStore, type ThemeMeta, type ThemeId } from '$lib/stores/theme.svelte';

  const defaultThemes = $derived(themeStore.availableThemes.filter((t) => !t.isExclusive));
  const exclusiveThemes = $derived(themeStore.availableThemes.filter((t) => t.isExclusive));
  const activeMeta = $derived(
    themeStore.availableThemes.find((t) => t.id === themeStore.currentTheme)
  );
</script>

{#snippet themePreview(colors: [string, string, string], mode: 'dark' | 'light')}
  {@const [primary, surface, secondary] = colors}
  <div
    class="w-full h-10 rounded-xl flex items-center justify-center gap-1.5 relative overflow-hidden"
    style="background-color: {surface}; border: 1px solid {primary}22;"
  >
    {#if mode === 'dark'}
      <div
        class="absolute inset-0 opacity-20"
        style="background: radial-gradient(ellipse at 70% 30%, {primary}60, transparent 70%);"
      ></div>
    {/if}
    <div class="w-4 h-4 rounded-full shadow-sm" style="background-color: {primary};"></div>
    <div class="w-3 h-3 rounded-full shadow-sm opacity-80" style="background-color: {secondary};"></div>
    <div
      class="w-2.5 h-2.5 rounded-full shadow-sm opacity-60"
      style="background-color: {primary}; filter: brightness(1.4);"
    ></div>
  </div>
{/snippet}

{#snippet themeCard(theme: ThemeMeta & { unlocked: boolean })}
  {@const isActive = themeStore.currentTheme === theme.id}
  {@const [primary] = theme.preview}
  <button
    type="button"
    onclick={() => {
      if (theme.unlocked) themeStore.setTheme(theme.id);
    }}
    class="relative flex flex-col gap-2 p-2.5 rounded-2xl border transition-all duration-200 {isActive
      ? 'border-primary/70 shadow-md ring-2 ring-primary/30 bg-primary/5'
      : theme.unlocked
        ? 'border-outline-variant/20 hover:border-primary/30 hover:bg-surface-container cursor-pointer'
        : 'border-outline-variant/10 opacity-50 cursor-not-allowed bg-surface-container-lowest/50'}"
    aria-label="Tema {theme.name}{!theme.unlocked ? ' (terkunci)' : ''}"
    aria-pressed={isActive}
    title={theme.name}
  >
    {@render themePreview(theme.preview, theme.mode)}

    <div class="flex items-center justify-between gap-1 px-0.5 w-full">
      <div class="relative group/name min-w-0 flex-1 text-left">
        <span class="text-[11px] font-semibold text-on-surface leading-tight line-clamp-2">
          {theme.name}
        </span>
      </div>

      <div class="flex items-center gap-1 flex-shrink-0">
        {#if theme.isExclusive}
          <span class="text-[9px] leading-none" title="Tema Eksklusif">⭐</span>
        {/if}
        {#if isActive}
          <span
            class="material-symbols-outlined text-[13px] leading-none"
            style="color: {primary}; font-variation-settings: 'FILL' 1;"
          >
            check_circle
          </span>
        {/if}
        {#if !theme.unlocked}
          <span class="material-symbols-outlined text-[13px] leading-none text-on-surface-variant/50">
            lock
          </span>
        {/if}
      </div>
    </div>
  </button>
{/snippet}

<div class="space-y-4">
  <!-- Header -->
  <div class="flex items-center gap-3 px-0.5">
    <span class="material-symbols-outlined text-primary text-xl">palette</span>
    <div>
      <p class="font-semibold text-sm text-on-surface">Tema Aplikasi</p>
      <p class="text-[11px] text-on-surface-variant/70">
        {activeMeta?.name ?? 'Slate Dark'}
      </p>
    </div>
  </div>

  <!-- Default themes grid -->
  <div>
    <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 mb-2 ml-0.5">
      Default
    </p>
    <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {#each defaultThemes as theme (theme.id)}
        {@render themeCard(theme)}
      {/each}
    </div>
  </div>

  <!-- Exclusive themes -->
  {#if exclusiveThemes.length > 0}
    <div>
      <div class="flex items-center gap-1.5 mb-2 ml-0.5">
        <span class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
          Eksklusif
        </span>
        <span class="text-[10px]">⭐</span>
      </div>
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {#each exclusiveThemes as theme (theme.id)}
          {@render themeCard(theme)}
        {/each}
      </div>
      {#if exclusiveThemes.every((t) => !t.unlocked)}
        <p class="text-[11px] text-on-surface-variant/50 mt-2 ml-0.5 flex items-center gap-1">
          <span class="material-symbols-outlined text-sm">info</span>
          Tema eksklusif hanya tersedia untuk akun tertentu.
        </p>
      {/if}
    </div>
  {/if}
</div>

