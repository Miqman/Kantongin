<script lang="ts">
  // Feature highlights for the marquee
  const FEATURES = [
    { name: 'AI Voice Input', icon: 'mic' },
    { name: 'Scan Struk AI', icon: 'receipt_long' },
    { name: 'Offline-First (Dexie)', icon: 'cloud_off' },
    { name: 'Google Sheets Sync', icon: 'table_chart' },
    { name: '13 Tema Eksklusif', icon: 'palette' },
    { name: 'Pure BFF Architecture', icon: 'shield' },
    { name: 'Tanpa Iklan', icon: 'verified' },
    { name: 'Grafik Interaktif', icon: 'insights' },
  ];
</script>

<div class="relative w-full bg-zinc-950 text-white overflow-hidden font-sans">
  <!-- Scoped Animations -->
  <style>
    @keyframes fadeSlideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes marquee {
      from {
        transform: translateX(0);
      }
      to {
        transform: translateX(-50%);
      }
    }
    .animate-fade-in {
      animation: fadeSlideIn 0.8s ease-out forwards;
      opacity: 0;
    }
    .animate-marquee {
      animation: marquee 35s linear infinite;
    }
    .delay-100 {
      animation-delay: 0.1s;
    }
    .delay-200 {
      animation-delay: 0.2s;
    }
    .delay-300 {
      animation-delay: 0.3s;
    }
    .delay-400 {
      animation-delay: 0.4s;
    }
    .delay-500 {
      animation-delay: 0.5s;
    }
  </style>

  <!-- Background Decorative Mesh / Image with Gradient Mask -->
  <div
    class="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))] pointer-events-none"
  ></div>
  <div
    class="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1764231467896-73f0ef4438aa?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-25 pointer-events-none"
    style="mask-image: linear-gradient(180deg, transparent, black 10%, black 70%, transparent); -webkit-mask-image: linear-gradient(180deg, transparent, black 10%, black 70%, transparent);"
  ></div>

  <!-- Ambient Glow Orbs -->
  <div
    class="absolute top-1/4 -left-48 w-96 h-96 rounded-full bg-primary/20 blur-[128px] pointer-events-none"
  ></div>
  <div
    class="absolute top-1/3 -right-48 w-96 h-96 rounded-full bg-amber-500/15 blur-[128px] pointer-events-none"
  ></div>

  <div class="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 md:pt-36 md:pb-24 lg:px-8">
    <div class="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-start">
      <!-- --- LEFT COLUMN --- -->
      <div class="lg:col-span-7 flex flex-col justify-center space-y-8 pt-4 sm:pt-8">
        <!-- Floating Badge -->
        <div class="animate-fade-in delay-100">
          <div
            class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md transition-colors hover:bg-white/10 shadow-sm"
          >
            <span class="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <span class="material-symbols-outlined text-amber-400 text-sm">stars</span>
              Smart Financial Assistant 2.0
            </span>
          </div>
        </div>

        <!-- Big Headline -->
        <h1
          class="animate-fade-in delay-200 text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.05]"
          style="mask-image: linear-gradient(180deg, black 0%, black 85%, transparent 100%); -webkit-mask-image: linear-gradient(180deg, black 0%, black 85%, transparent 100%);"
        >
          Kelola Finansial<br />
          <span class="bg-gradient-to-br from-white via-zinc-100 to-amber-300 bg-clip-text text-transparent">
            Lebih Tenang, Cerdas
          </span><br />
          & Terkendali
        </h1>

        <!-- Subtitle Description -->
        <p class="animate-fade-in delay-300 max-w-xl text-base sm:text-lg text-zinc-400 leading-relaxed font-normal">
          Catat pengeluaran otomatis dengan AI suara & foto struk, rencanakan anggaran bulanan, dan simpan data Anda
          100% aman dengan arsitektur offline-first murni.
        </p>

        <!-- CTA Buttons -->
        <div class="animate-fade-in delay-400 flex flex-col sm:flex-row gap-4 pt-2">
          <a
            href="/"
            class="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-zinc-950 transition-all hover:scale-[1.02] hover:bg-zinc-200 active:scale-[0.98] shadow-xl cursor-pointer"
          >
            <span>Mulai Sekarang (Gratis)</span>
            <span class="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
          </a>

          <a
            href="/login"
            class="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10 hover:border-white/20 active:scale-[0.98] cursor-pointer"
          >
            <span class="material-symbols-outlined text-sm">login</span>
            <span>Masuk ke Akun</span>
          </a>
        </div>

        <!-- Trust Badges Under CTA -->
        <div class="animate-fade-in delay-500 flex flex-wrap items-center gap-6 pt-4 text-xs text-zinc-400">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
            <span>Tanpa Kartu Kredit</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
            <span>Bisa Langsung Dipakai (Mode Tamu)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
            <span>Bebas Iklan Selamanya</span>
          </div>
        </div>
      </div>

      <!-- --- RIGHT COLUMN --- -->
      <div class="lg:col-span-5 space-y-6 lg:mt-6">
        <!-- Glassmorphism Stats Card -->
        <div
          class="animate-fade-in delay-500 relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 sm:p-8 backdrop-blur-xl shadow-2xl"
        >
          <!-- Card Glow Radial -->
          <div
            class="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl pointer-events-none"
          ></div>

          <div class="relative z-10">
            <!-- Header target metric -->
            <div class="flex items-center gap-4 mb-8">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 ring-1 ring-primary/40 text-primary-fixed"
              >
                <span class="material-symbols-outlined text-2xl">savings</span>
              </div>
              <div>
                <div class="text-3xl font-extrabold tracking-tight text-white font-headline">100%</div>
                <div class="text-xs sm:text-sm text-zinc-400 font-medium">Offline-First & Data Pribadi Aman</div>
              </div>
            </div>

            <!-- Progress Bar Section: Financial Health -->
            <div class="space-y-3 mb-8">
              <div class="flex justify-between text-xs sm:text-sm">
                <span class="text-zinc-400">Efisiensi Anggaran Bulanan</span>
                <span class="text-white font-semibold">94%</span>
              </div>
              <div class="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800/60 p-0.5">
                <div
                  class="h-full w-[94%] rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300"
                ></div>
              </div>
            </div>

            <div class="h-px w-full bg-white/10 mb-6"></div>

            <!-- Mini Stats Grid -->
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="flex flex-col items-center justify-center transition-transform hover:-translate-y-1 cursor-default">
                <span class="text-xl font-bold text-white sm:text-2xl font-headline">13+</span>
                <span class="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold sm:text-xs">Tema Warna</span>
              </div>
              <div class="w-px h-full bg-white/10 mx-auto"></div>
              <div class="flex flex-col items-center justify-center transition-transform hover:-translate-y-1 cursor-default">
                <span class="text-xl font-bold text-white sm:text-2xl font-headline">0s</span>
                <span class="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold sm:text-xs">Lag Response</span>
              </div>
              <div class="w-px h-full bg-white/10 mx-auto"></div>
              <div class="flex flex-col items-center justify-center transition-transform hover:-translate-y-1 cursor-default">
                <span class="text-xl font-bold text-white sm:text-2xl font-headline">100%</span>
                <span class="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold sm:text-xs">Bebas Pelacak</span>
              </div>
            </div>

            <!-- Status Pills -->
            <div class="mt-8 flex flex-wrap gap-2.5">
              <div
                class="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-zinc-300 shadow-sm"
              >
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE READY
              </div>
              <div
                class="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-zinc-300 shadow-sm"
              >
                <span class="material-symbols-outlined text-amber-400 text-xs">auto_awesome</span>
                AI ASSISTANT
              </div>
              <div
                class="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-zinc-300 shadow-sm"
              >
                <span class="material-symbols-outlined text-sky-400 text-xs">shield_lock</span>
                PURE BFF
              </div>
            </div>
          </div>
        </div>

        <!-- Marquee Card -->
        <div
          class="animate-fade-in delay-500 relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 py-6 backdrop-blur-xl shadow-xl"
        >
          <h3 class="mb-5 px-7 text-xs font-bold uppercase tracking-wider text-zinc-400">
            Fitur & Keunggulan Utama
          </h3>

          <div
            class="relative flex overflow-hidden"
            style="mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);"
          >
            <div class="animate-marquee flex gap-8 whitespace-nowrap px-4">
              {#each [...FEATURES, ...FEATURES, ...FEATURES] as item}
                <div
                  class="flex items-center gap-2.5 opacity-60 transition-all hover:opacity-100 hover:scale-105 cursor-default group"
                >
                  <span class="material-symbols-outlined text-base text-zinc-300 group-hover:text-amber-400 transition-colors">
                    {item.icon}
                  </span>
                  <span class="text-sm font-bold text-white tracking-tight">
                    {item.name}
                  </span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

