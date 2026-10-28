<script lang="ts">
  import TopAppBar from '$lib/components/common/TopAppBar.svelte';

  let email = $state('');
  let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
  let errorMessage = $state('');

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    status = 'loading';
    errorMessage = '';

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        errorMessage = data.error || 'Gagal mengirim email reset password';
        status = 'error';
      } else {
        status = 'success';
      }
    } catch {
      errorMessage = 'Terjadi kesalahan koneksi';
      status = 'error';
    }
  }
</script>

<TopAppBar />

<main class="pt-24 px-4 pb-24 max-w-md mx-auto">
  <div class="mb-8">
    <h1 class="font-headline text-3xl font-bold text-on-surface">Reset Password</h1>
    <p class="text-on-surface-variant mt-2 text-sm">
      Masukkan email Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi.
    </p>
  </div>

  {#if status === 'success'}
    <div class="bg-primary/10 text-primary border border-primary/20 p-5 rounded-2xl mb-6 space-y-1 animate-in fade-in duration-200">
      <h3 class="font-bold text-base flex items-center gap-2">
        <span class="material-symbols-outlined text-xl">mark_email_read</span>
        Email Terkirim!
      </h3>
      <p class="text-xs text-on-surface-variant leading-relaxed">
        Silakan periksa kotak masuk (atau folder spam) email Anda untuk instruksi pemulihan kata sandi.
      </p>
    </div>
  {:else}
    <form onsubmit={handleSubmit} class="space-y-4">
      {#if status === 'error'}
        <div class="p-3 bg-error/10 text-error rounded-xl text-sm font-medium animate-in fade-in duration-200">
          {errorMessage}
        </div>
      {/if}

      <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/15 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
        <label for="forgot-email" class="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">
          Email
        </label>
        <div class="flex items-center">
          <span class="material-symbols-outlined text-on-surface-variant mr-2 text-xl">
            mail
          </span>
          <input
            id="forgot-email"
            type="email"
            required
            bind:value={email}
            class="bg-transparent border-none focus:ring-0 p-0 text-sm w-full outline-none text-on-surface placeholder:text-on-surface-variant/30 font-medium"
            placeholder="anda@email.com"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        class="w-full py-4 mt-4 rounded-full bg-primary text-on-primary font-headline font-bold text-base shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-wait cursor-pointer"
      >
        {status === 'loading' ? 'Mengirim...' : 'Kirim Link Reset'}
      </button>
    </form>
  {/if}

  <div class="mt-8 text-center text-sm text-on-surface-variant">
    Ingat password Anda?{' '}
    <a href="/login" class="text-primary font-bold hover:underline">
      Masuk sekarang
    </a>
  </div>
</main>

