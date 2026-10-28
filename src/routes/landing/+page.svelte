<script lang="ts">
  import GlassmorphismHero from '$lib/components/landing/GlassmorphismHero.svelte';
  import BentoFeatures from '$lib/components/landing/BentoFeatures.svelte';
  import ResizableNavbar from '$lib/components/landing/ResizableNavbar.svelte';
  import { reveal } from '$lib/actions/reveal';

  let activeFaq = $state<number | null>(null);

  const FAQS = [
    {
      q: 'Apakah Uangmu gratis digunakan?',
      a: 'Ya, Uangmu 100% gratis digunakan tanpa biaya tersembunyi dan bebas iklan selamanya. Anda bisa langsung memakainya dalam Mode Tamu tanpa perlu mendaftar.',
    },
    {
      q: 'Bagaimana keamanan data keuangan saya?',
      a: 'Keamanan adalah prioritas utama. Kami menggunakan arsitektur Pure BFF (Backend-for-Frontend) di mana kredensial database tidak pernah dikirim ke browser. Sesi pengguna dilindungi HTTP-Only Cookies dan koneksi SSL terenkripsi.',
    },
    {
      q: 'Apakah bisa digunakan saat offline tanpa internet?',
      a: 'Sangat bisa! Uangmu dirancang Offline-First dengan Dexie IndexedDB. Anda bisa mencatat transaksi di mana saja meski tanpa sinyal, dan data akan otomatis tersinkronisasi saat Anda online kembali.',
    },
    {
      q: 'Bagaimana cara kerja pencatatan otomatis dengan AI?',
      a: 'Cukup tekan tombol mic lalu sebutkan pengeluaran Anda (misal: "Beli kopi 25 ribu"), atau unggah foto struk belanja. AI kami akan mengekstrak nominal, kategori, catatan, dan tanggal secara otomatis.',
    },
    {
      q: 'Apakah data saya bisa dicadangkan ke Google Sheets?',
      a: 'Ya! Anda bisa menghubungkan akun Google Anda dan setiap transaksi dapat disinkronkan langsung ke spreadsheet pribadi Google Sheets secara rapi dan otomatis.',
    },
  ];

  function toggleFaq(index: number) {
    activeFaq = activeFaq === index ? null : index;
  }
</script>

<svelte:head>
  <title>Uangmu - Aplikasi Manajemen Keuangan Pribadi Cerdas</title>
  <meta
    name="description"
    content="Kelola anggaran, catat transaksi otomatis dengan AI suara & struk, dan pantau pengeluaran Anda dengan aman dan offline-first."
  />
</svelte:head>

<div class="min-h-screen bg-zinc-950 text-white selection:bg-amber-400/30 selection:text-amber-200 font-sans">
  <!-- Dynamic Resizable Navbar (Aceternity / 21st.dev Style) -->
  <ResizableNavbar />

  <!-- Hero Section (Glassmorphism Trust Hero) -->
  <GlassmorphismHero />

  <!-- Bento Features Section (Monochrome Bento) -->
  <div id="fitur">
    <BentoFeatures />
  </div>

  <!-- Security & Trust Section (Styling Seragam dengan Bento) -->
  <section id="keamanan" class="relative py-24 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/10">
    <!-- Header Minimalis Seragam -->
    <header use:reveal class="mb-12 flex flex-col gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
      <div class="flex flex-col gap-2.5">
        <span class="text-xs uppercase tracking-[0.35em] text-sky-400 font-bold">
          KEAMANAN TINGKAT TINGGI
        </span>
        <h2 class="text-3xl font-black tracking-tight text-white md:text-5xl font-headline">
          Privasi Tanpa Kompromi
        </h2>
      </div>
      <div class="flex flex-col items-start gap-4 md:items-end">
        <p class="max-w-md text-sm text-zinc-400 md:text-base leading-relaxed">
          Data keuangan Anda bukan komoditas. Uangmu dibangun dengan filosofi Zero-Knowledge dan arsitektur server terisolasi.
        </p>
      </div>
    </header>

    <!-- Modular Security Cards (3-Column Grid) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-3.5">
      <!-- Security Card 1 -->
      <article
        use:reveal={{ delay: 0 }}
        class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_28px_70px_rgba(0,0,0,0.55)]"
      >
        <div class="flex items-start gap-4 mb-4">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
          >
            <span class="material-symbols-outlined text-2xl">verified_user</span>
          </div>
          <div class="flex-1 min-w-0">
            <header class="flex items-center gap-2 mb-1.5">
              <h3 class="text-base font-bold uppercase tracking-wide text-white font-headline">Pure BFF</h3>
              <span class="ml-auto rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-semibold">
                ARCH
              </span>
            </header>
            <p class="text-sm leading-relaxed text-zinc-400">
              Kredensial database Supabase tidak pernah bocor ke sisi klien browser. Seluruh interaksi data divalidasi ketat lewat server bridge pribadi.
            </p>
          </div>
        </div>
      </article>

      <!-- Security Card 2 -->
      <article
        use:reveal={{ delay: 100 }}
        class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_28px_70px_rgba(0,0,0,0.55)]"
      >
        <div class="flex items-start gap-4 mb-4">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-400"
          >
            <span class="material-symbols-outlined text-2xl">lock</span>
          </div>
          <div class="flex-1 min-w-0">
            <header class="flex items-center gap-2 mb-1.5">
              <h3 class="text-base font-bold uppercase tracking-wide text-white font-headline">HTTP-Only</h3>
              <span class="ml-auto rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-semibold">
                AUTH
              </span>
            </header>
            <p class="text-sm leading-relaxed text-zinc-400">
              Token sesi disimpan dalam cookie terlindung yang tidak dapat diakses oleh JavaScript peretas (kebal terhadap serangan XSS).
            </p>
          </div>
        </div>
      </article>

      <!-- Security Card 3 -->
      <article
        use:reveal={{ delay: 200 }}
        class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_28px_70px_rgba(0,0,0,0.55)]"
      >
        <div class="flex items-start gap-4 mb-4">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-400"
          >
            <span class="material-symbols-outlined text-2xl">block</span>
          </div>
          <div class="flex-1 min-w-0">
            <header class="flex items-center gap-2 mb-1.5">
              <h3 class="text-base font-bold uppercase tracking-wide text-white font-headline">Zero Trackers</h3>
              <span class="ml-auto rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-semibold">
                POLICY
              </span>
            </header>
            <p class="text-sm leading-relaxed text-zinc-400">
              Bebas iklan selamanya. Data mutasi keuangan tidak pernah dijual ke pihak ketiga untuk pinjaman online atau promosi kredit.
            </p>
          </div>
        </div>
      </article>
    </div>

    <!-- Telemetry Status Bar Card (Full Width) -->
    <div
      use:reveal={{ delay: 150 }}
      class="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-400"
    >
      <div class="flex items-center gap-3">
        <span class="relative flex h-2.5 w-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span class="font-bold text-white uppercase tracking-wider">Status Keamanan Sistem:</span>
        <span class="text-emerald-400">OPERASIONAL AMAN</span>
      </div>

      <div class="flex flex-wrap items-center gap-4 sm:gap-6 text-zinc-400">
        <span>TLS 1.3 / AES-256</span>
        <span>•</span>
        <span>Leakage: 0%</span>
        <span>•</span>
        <span>Ekspor: PDF/CSV Bebas</span>
      </div>
    </div>
  </section>

  <!-- FAQ Section (Styling Seragam dengan Bento) -->
  <section id="faq" class="py-24 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/10">
    <!-- Header Minimalis Seragam -->
    <header use:reveal class="mb-12 flex flex-col gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
      <div class="flex flex-col gap-2.5">
        <span class="text-xs uppercase tracking-[0.35em] text-amber-400 font-bold">
          PUSAT INFORMASI
        </span>
        <h2 class="text-3xl font-black tracking-tight text-white md:text-5xl font-headline">
          Pertanyaan Umum (FAQ)
        </h2>
      </div>
      <div class="flex flex-col items-start gap-4 md:items-end">
        <p class="max-w-md text-sm text-zinc-400 md:text-base leading-relaxed">
          Jawaban langsung dan transparan untuk pertanyaan yang kerap diajukan seputar privasi, offline-mode, dan fitur.
        </p>
      </div>
    </header>

    <div class="space-y-3">
      {#each FAQS as item, index}
        {@const isOpen = activeFaq === index}
        <article
          use:reveal={{ delay: index * 60 }}
          class="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-300 hover:border-white/20 overflow-hidden"
        >
          <button
            type="button"
            onclick={() => toggleFaq(index)}
            class="w-full flex items-center justify-between p-5 sm:p-6 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
          >
            <span class="font-headline font-bold text-sm sm:text-base text-white">{item.q}</span>
            <span
              class="material-symbols-outlined text-zinc-400 text-lg transition-transform duration-200 {isOpen
                ? 'rotate-180 text-amber-400'
                : ''}"
            >
              expand_more
            </span>
          </button>
          {#if isOpen}
            <div class="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-4">
              {item.a}
            </div>
          {/if}
        </article>
      {/each}
    </div>
  </section>

  <!-- Final CTA Callout (Glassmorphic) -->
  <section class="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
    <div
      use:reveal={{ y: 32 }}
      class="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-10 sm:p-16 text-center backdrop-blur-2xl shadow-2xl"
    >
      <!-- Subtle Ambient Glow -->
      <div
        class="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl pointer-events-none"
      ></div>

      <div class="relative z-10 max-w-xl mx-auto space-y-6">
        <div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider backdrop-blur-md">
          <span class="material-symbols-outlined text-amber-400 text-sm">stars</span>
          Mulai Tanpa Hambatan
        </div>

        <h2 class="text-3xl sm:text-5xl font-black font-headline text-white tracking-tight leading-tight">
          Ambil Kendali Finansial Anda Sekarang
        </h2>
        <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">
          Coba langsung dalam hitungan detik. Tanpa registrasi rumit, tanpa kartu kredit, dan tanpa iklan.
        </p>

        <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-zinc-950 hover:bg-zinc-200 transition-all shadow-xl active:scale-95 cursor-pointer"
          >
            <span>Buka Dashboard</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
          <a
            href="/login"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
          >
            <span>Masuk ke Akun Cloud</span>
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer use:reveal={{ y: 16 }} class="border-t border-white/10 py-12 px-4 sm:px-6 max-w-6xl mx-auto text-xs text-zinc-500">
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2.5">
        <img
          src="/android-chrome-192x192.png"
          alt="Logo Uangmu"
          class="w-5 h-5 rounded-md object-contain"
        />
        <span class="font-bold text-white">Uangmu</span>
        <span>•</span>
        <span>Aplikasi Finansial Pribadi Modern & Terbuka</span>
      </div>
      <div>
        <span>&copy; {new Date().getFullYear()} Uangmu. All rights reserved.</span>
      </div>
    </div>
  </footer>
</div>

<style>
  /* ponytail: Clean, app-like landing page experience by hiding the window scrollbar */
  :global(html) {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE / Edge */
  }
  :global(html::-webkit-scrollbar),
  :global(body::-webkit-scrollbar) {
    display: none; /* Chrome, Safari, Opera */
  }
</style>
