<script lang="ts">
  import { appStore } from '$lib/stores/app.svelte';
  import db from '$lib/db/dexie';

  const SESSION_KEY = 'uangmu_banner_dismissed';

  let hasLocalData = $state(false);
  let dismissed = $state(true);

  $effect(() => {
    if (appStore.user) return;
    if (typeof sessionStorage === 'undefined') return;

    const isDismissed = sessionStorage.getItem(SESSION_KEY) === '1';
    if (isDismissed) return;

    db.transactions.count().then((count) => {
      hasLocalData = count > 0;
      dismissed = false;
    });
  });

  function handleDismiss() {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, '1');
    }
    dismissed = true;
  }
</script>

{#if !appStore.user && !dismissed && hasLocalData}
  <div class="relative bg-gradient-to-r from-primary/10 via-primary/8 to-secondary/10 border border-primary/15 rounded-2xl px-4 py-3.5 flex items-center gap-3">
    <!-- Icon -->
    <div class="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
      <span class="material-symbols-outlined text-primary text-[20px]">cloud_upload</span>
    </div>

    <!-- Text -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-bold text-on-surface leading-tight">
        Backup data ke cloud
      </p>
      <p class="text-xs text-on-surface-variant mt-0.5 leading-snug">
        Data lokal Anda akan otomatis tersinkron saat buat akun.
      </p>
    </div>

    <!-- CTA -->
    <a
      href="/register"
      class="flex-shrink-0 px-3.5 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold whitespace-nowrap active:scale-95 transition-transform shadow-sm"
    >
      Buat Akun
    </a>

    <!-- Dismiss -->
    <button
      type="button"
      onclick={handleDismiss}
      aria-label="Tutup banner"
      class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer"
    >
      <span class="material-symbols-outlined text-on-surface-variant text-[18px]">close</span>
    </button>
  </div>
{/if}

