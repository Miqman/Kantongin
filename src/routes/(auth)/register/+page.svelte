<script lang="ts">
  import { goto } from '$app/navigation';
  import { appStore } from '$lib/stores/app.svelte';
  import { syncGuestToCloud } from '$lib/sync';
  import TopAppBar from '$lib/components/common/TopAppBar.svelte';
  import GoogleSignInButton from '$lib/components/auth/GoogleSignInButton.svelte';

  let email = $state('');
  let password = $state('');
  let error = $state<string | null>(null);
  let message = $state<string | null>(null);
  let loading = $state(false);
  let showPassword = $state(false);

  $effect(() => {
    if (appStore.user) {
      goto('/');
    }
  });

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    loading = true;
    error = null;
    message = null;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        error = data.error || 'Gagal mendaftar';
        loading = false;
        return;
      }

      // If user session returned immediately (email confirmation disabled or auto-confirm)
      if (data.user) {
        appStore.setUser(data.user);
        await syncGuestToCloud().catch(console.error);
        await appStore.fetchData({ force: true });
        message = 'Berhasil mendaftar! Mengalihkan...';
        setTimeout(() => goto('/'), 1000);
      } else {
        message =
          'Akun berhasil dibuat! Silakan periksa email untuk verifikasi (jika diaktifkan), lalu silakan masuk.';
        loading = false;
        setTimeout(() => goto('/login'), 2500);
      }
    } catch {
      error = 'Terjadi kesalahan koneksi';
      loading = false;
    }
  }
</script>

<TopAppBar />

<main class="px-6 pt-12 max-w-sm mx-auto flex flex-col justify-center min-h-[70vh]">
  <div class="text-center mb-10">
    <h1 class="font-headline text-3xl font-bold tracking-tight mb-2">Daftar</h1>
    <p class="text-on-surface-variant text-sm font-medium">Buat akun untuk mencadangkan data secara cloud</p>
  </div>

  <form onsubmit={handleSubmit} class="space-y-5">
    {#if error}
      <div class="p-4 rounded-xl bg-error/10 text-error text-sm font-medium animate-in fade-in duration-200">
        {error}
      </div>
    {/if}

    {#if message}
      <div class="p-4 rounded-xl bg-secondary/10 text-secondary text-sm font-medium animate-in fade-in duration-200">
        {message}
      </div>
    {/if}

    <div class="space-y-2">
      <label for="register-email" class="font-label text-xs uppercase tracking-widest text-on-surface-variant/80 ml-1 block">
        Email
      </label>
      <div class="bg-surface-container-low p-4 rounded-xl flex items-center gap-3 border border-outline-variant/5 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
        <span class="material-symbols-outlined text-on-surface-variant text-xl">mail</span>
        <input
          id="register-email"
          type="email"
          bind:value={email}
          required
          class="bg-transparent border-none focus:ring-0 p-0 text-sm w-full outline-none text-on-surface"
          placeholder="email@anda.com"
        />
      </div>
    </div>

    <div class="space-y-2">
      <label for="register-password" class="font-label text-xs uppercase tracking-widest text-on-surface-variant/80 ml-1 block">
        Kata Sandi
      </label>
      <div class="bg-surface-container-low p-4 rounded-xl flex items-center gap-3 border border-outline-variant/5 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
        <span class="material-symbols-outlined text-on-surface-variant text-xl">lock</span>
        <input
          id="register-password"
          type={showPassword ? 'text' : 'password'}
          bind:value={password}
          required
          minlength={6}
          class="bg-transparent border-none focus:ring-0 p-0 text-sm w-full outline-none text-on-surface"
          placeholder="Min. 6 karakter"
        />
        <button
          type="button"
          onclick={() => (showPassword = !showPassword)}
          class="flex items-center justify-center text-on-surface-variant/60 hover:text-on-surface transition-colors focus:outline-none cursor-pointer"
          aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
        >
          <span class="material-symbols-outlined text-xl">
            {showPassword ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>
    </div>

    <button
      type="submit"
      disabled={loading}
      class="w-full py-4 mt-4 rounded-full bg-primary text-on-primary font-headline font-bold text-base shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-wait cursor-pointer"
    >
      {loading ? 'Memproses...' : 'Buat Akun & Sinkronkan Data'}
    </button>
  </form>

  <!-- Divider -->
  <div class="flex items-center gap-4 my-6">
    <div class="flex-1 h-px bg-outline-variant/30"></div>
    <span class="text-xs font-medium text-on-surface-variant/60 uppercase tracking-widest">atau daftar dengan</span>
    <div class="flex-1 h-px bg-outline-variant/30"></div>
  </div>

  <!-- Google OAuth -->
  <GoogleSignInButton />

  <div class="mt-8 text-center text-sm text-on-surface-variant">
    Sudah punya akun?{' '}
    <a href="/login" class="text-primary font-bold hover:underline">
      Masuk sekarang
    </a>
  </div>
</main>

