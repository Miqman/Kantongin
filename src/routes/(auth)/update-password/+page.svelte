<script lang="ts">
  import { goto } from '$app/navigation';
  import { toast } from '$lib/stores/toast.svelte';
  import TopAppBar from '$lib/components/common/TopAppBar.svelte';

  let password = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    loading = true;
    error = null;

    if (password.length < 6) {
      error = 'Password minimal 6 karakter.';
      loading = false;
      return;
    }

    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        error = data.error || 'Gagal memperbarui password';
        loading = false;
      } else {
        toast.success('Password berhasil diperbarui!');
        goto('/');
      }
    } catch {
      error = 'Terjadi kesalahan koneksi';
      loading = false;
    }
  }
</script>

<TopAppBar />

<main class="pt-24 px-4 pb-24 max-w-md mx-auto">
  <div class="mb-8">
    <h1 class="font-headline text-3xl font-bold text-on-surface">Password Baru</h1>
    <p class="text-on-surface-variant mt-2 text-sm">
      Silakan masukkan password baru untuk akun Anda.
    </p>
  </div>

  <form onsubmit={handleSubmit} class="space-y-4">
    {#if error}
      <div class="p-3 bg-error/10 text-error rounded-xl text-sm font-medium animate-in fade-in duration-200">
        {error}
      </div>
    {/if}

    <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/15 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
      <label for="new-password" class="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">
        Password Baru
      </label>
      <div class="flex items-center">
        <span class="material-symbols-outlined text-on-surface-variant mr-2 text-xl">
          lock
        </span>
        <input
          id="new-password"
          type="password"
          required
          bind:value={password}
          class="bg-transparent border-none focus:ring-0 p-0 text-sm w-full outline-none text-on-surface placeholder:text-on-surface-variant/30 font-medium"
          placeholder="••••••••"
          minlength={6}
        />
      </div>
    </div>

    <button
      type="submit"
      disabled={loading}
      class="w-full py-4 mt-4 rounded-full bg-primary text-on-primary font-headline font-bold text-base shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-wait cursor-pointer"
    >
      {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
    </button>
  </form>
</main>

