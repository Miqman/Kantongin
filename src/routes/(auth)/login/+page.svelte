<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { appStore } from '$lib/stores/app.svelte';
  import { syncGuestToCloud } from '$lib/sync';
  import TopAppBar from '$lib/components/common/TopAppBar.svelte';
  import GoogleSignInButton from '$lib/components/auth/GoogleSignInButton.svelte';

  let email = $state('');
  let password = $state('');
  let error = $state<string | null>(page.url.searchParams.get('message'));
  let loading = $state(false);
  let showPassword = $state(false);

  // If already logged in, redirect to home
  $effect(() => {
    if (appStore.user) {
      goto('/');
    }
  });

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    loading = true;
    error = null;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          data.error === 'Invalid login credentials'
            ? 'Email atau kata sandi salah'
            : data.error || 'Gagal masuk';
        error = msg;
        loading = false;
        return;
      }

      if (data.user) {
        appStore.setUser(data.user);
        // Automatically sync guest data to cloud
        await syncGuestToCloud().catch(console.error);
        await appStore.fetchData({ force: true });
        goto('/');
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
    <h1 class="font-headline text-3xl font-bold tracking-tight mb-2">Masuk</h1>
    <p class="text-on-surface-variant text-sm font-medium">Sinkronkan data Dompetku Anda</p>
  </div>

  <form onsubmit={handleSubmit} class="space-y-5">
    {#if error}
      <div class="p-4 rounded-xl bg-error/10 text-error text-sm font-medium animate-in fade-in duration-200">
        {error}
      </div>
    {/if}

    <div class="space-y-2 group">
      <label for="login-email" class="font-label text-xs uppercase tracking-widest text-on-surface-variant/80 ml-1 group-focus-within:text-primary transition-colors block">
        Email
      </label>
      <div class="bg-surface-container-low hover:bg-surface-container transition-all p-4 rounded-2xl flex items-center gap-4 border border-outline-variant/5 focus-within:bg-surface-bright focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary/20">
        <span class="material-symbols-outlined text-on-surface-variant text-xl group-focus-within:text-primary transition-colors">
          mail
        </span>
        <input
          id="login-email"
          type="email"
          bind:value={email}
          required
          class="bg-transparent border-none focus:ring-0 p-0 text-sm w-full outline-none text-on-surface placeholder:text-on-surface-variant/30 font-medium"
          placeholder="email@anda.com"
        />
      </div>
    </div>

    <div class="space-y-2 group">
      <div class="flex justify-between items-center ml-1">
        <label for="login-password" class="font-label text-xs uppercase tracking-widest text-on-surface-variant/80 group-focus-within:text-primary transition-colors block">
          Kata Sandi
        </label>
        <a href="/forgot-password" class="text-xs font-bold text-primary hover:underline">
          Lupa Password?
        </a>
      </div>
      <div class="bg-surface-container-low hover:bg-surface-container transition-all p-4 rounded-2xl flex items-center gap-4 border border-outline-variant/5 focus-within:bg-surface-bright focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary/20">
        <span class="material-symbols-outlined text-on-surface-variant text-xl group-focus-within:text-primary transition-colors">
          lock
        </span>
        <input
          id="login-password"
          type={showPassword ? 'text' : 'password'}
          bind:value={password}
          required
          class="bg-transparent border-none focus:ring-0 p-0 text-sm w-full outline-none text-on-surface placeholder:text-on-surface-variant/30 font-medium"
          placeholder="••••••••"
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
      {loading ? 'Memproses...' : 'Masuk'}
    </button>
  </form>

  <!-- Divider -->
  <div class="flex items-center gap-4 my-6">
    <div class="flex-1 h-px bg-outline-variant/30"></div>
    <span class="text-xs font-medium text-on-surface-variant/60 uppercase tracking-widest">atau</span>
    <div class="flex-1 h-px bg-outline-variant/30"></div>
  </div>

  <!-- Google OAuth -->
  <GoogleSignInButton />

  <div class="mt-8 text-center text-sm text-on-surface-variant">
    Belum punya akun?{' '}
    <a href="/register" class="text-primary font-bold hover:underline">
      Daftar sekarang
    </a>
  </div>

  <div class="mt-4 text-center text-xs text-on-surface-variant/70">
    <a href="/landing" class="hover:text-primary transition-colors inline-flex items-center justify-center gap-1">
      <span class="material-symbols-outlined text-sm">info</span>
      <span>Pelajari lebih lanjut tentang Uangmu</span>
    </a>
  </div>
</main>

