<script lang="ts">
  import { appStore } from '$lib/stores/app.svelte';

  function getInitials(email: string): string {
    return email.charAt(0).toUpperCase();
  }

  let user = $derived(appStore.user);
  let avatarUrl = $derived(user?.user_metadata?.avatar_url as string | undefined);
</script>

<nav class="sticky top-0 z-50 w-full px-5 py-3 flex justify-between items-center bg-surface/80 backdrop-blur-xl border-b border-outline-variant/8">
  <!-- Left: Avatar + brand -->
  <div class="flex items-center gap-3">
    <a
      href={user ? '/profil' : '/login'}
      class="relative flex-shrink-0 active:scale-95 transition-transform"
      aria-label={user ? 'Lihat profil' : 'Masuk ke akun'}
    >
      <div class="w-9 h-9 rounded-xl overflow-hidden bg-surface-container-high ring-1 ring-primary/20 flex items-center justify-center">
        {#if user}
          {#if avatarUrl}
            <img
              src={avatarUrl}
              alt="Foto profil"
              class="w-full h-full object-cover"
            />
          {:else}
            <div class="w-full h-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center">
              <span class="text-on-primary font-bold text-sm select-none">
                {getInitials(user.email ?? 'U')}
              </span>
            </div>
          {/if}
        {:else}
          <span class="material-symbols-outlined text-on-surface-variant text-[18px]">
            person
          </span>
        {/if}
      </div>
      {#if user}
        <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-secondary border-2 border-surface"></span>
      {/if}
    </a>

    <div class="leading-none">
      <h1 class="font-headline text-[1.1rem] font-extrabold tracking-[-0.03em] text-on-surface">
        Uangmu
      </h1>
      {#if user}
        <p class="text-[10px] text-on-surface-variant/60 font-medium mt-0.5 truncate max-w-[150px]">
          {user.email}
        </p>
      {:else}
        <a
          href="/login"
          class="text-[10px] text-primary font-semibold mt-0.5 block hover:opacity-80 transition-opacity"
        >
          Masuk / Daftar &rarr;
        </a>
      {/if}
    </div>
  </div>

  <!-- Right: Notification / Syncing indicator -->
  <div class="flex items-center gap-1.5">
    {#if appStore.isSyncing}
      <span class="w-2 h-2 rounded-full bg-primary animate-ping" title="Menyinkronkan..."></span>
    {/if}
    <button
      class="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-container-high active:bg-surface-container-highest transition-colors text-on-surface-variant active:scale-95 duration-150"
      aria-label="Notifikasi"
    >
      <span class="material-symbols-outlined text-[20px]">notifications</span>
    </button>
  </div>
</nav>

