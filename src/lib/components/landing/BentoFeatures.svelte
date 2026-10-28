<script lang="ts">
  import { reveal } from '$lib/actions/reveal';

  const features = [
    {
      title: 'AI Voice & Struk Scanner',
      meta: 'AI Core',
      icon: 'auto_awesome',
      animation: 'bento2-float 6s ease-in-out infinite',
      blurb:
        'Catat pengeluaran instan hanya dengan suara atau foto struk kasir. Algoritma Vision & LLM AI kami mengekstrak nominal, toko, kategori belanja, hingga tanggal secara otomatis tanpa mengetik manual.',
      previewType: 'ai-chips',
    },
    {
      title: '100% Offline-First',
      meta: 'Storage',
      icon: 'offline_pin',
      animation: 'bento2-pulse 4s ease-in-out infinite',
      blurb:
        'Didukung Dexie IndexedDB lokal. Tetap bekerja cepat tanpa internet di mana saja. Sinkron otomatis saat kembali online.',
      previewType: 'badge',
      badgeText: '0ms Latency',
    },
    {
      title: 'Google Sheets Sync',
      meta: 'Cloud',
      icon: 'table_chart',
      animation: 'bento2-tilt 5.5s ease-in-out infinite',
      blurb:
        'Dua arah ke spreadsheet Google pribadi Anda secara real-time. Data mutasi keuangan selalu menjadi milik Anda seutuhnya.',
      previewType: 'badge',
      badgeText: 'Auto Export',
    },
    {
      title: 'Pure BFF Security',
      meta: 'Privacy',
      icon: 'shield_lock',
      animation: 'bento2-drift 8s ease-in-out infinite',
      blurb:
        'Zero client-side Supabase SDK. Sesi pengguna terkunci dalam HTTP-Only cookie, kebal dari serangan XSS dan tanpa pelacak iklan pihak ketiga.',
      previewType: 'badge',
      badgeText: '0 Data Bocor',
    },
    {
      title: '13 Varian Tema Eksklusif',
      meta: 'Design',
      icon: 'palette',
      animation: 'bento2-glow 7s ease-in-out infinite',
      blurb:
        'Material You dengan 13 palet warna dinamis mulai dari Slate Ledger, Emerald Growth, hingga Cyberpunk. Lengkap dengan Dark Mode hemat daya.',
      previewType: 'theme-dots',
    },
  ];

  const spans = [
    'md:col-span-4 md:row-span-2',
    'md:col-span-2 md:row-span-1',
    'md:col-span-2 md:row-span-1',
    'md:col-span-3 md:row-span-1',
    'md:col-span-3 md:row-span-1',
  ];
</script>

<div class="relative w-full overflow-hidden bg-zinc-950 text-white font-sans py-24">
  <!-- Scoped Animations -->
  <style>
    @keyframes bento2-float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-6%);
      }
    }
    @keyframes bento2-pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 0.85;
      }
      50% {
        transform: scale(1.08);
        opacity: 1;
      }
    }
    @keyframes bento2-tilt {
      0% {
        transform: rotate(-2deg);
      }
      50% {
        transform: rotate(2deg);
      }
      100% {
        transform: rotate(-2deg);
      }
    }
    @keyframes bento2-drift {
      0%, 100% {
        transform: translate3d(0, 0, 0);
      }
      50% {
        transform: translate3d(6%, -6%, 0);
      }
    }
    @keyframes bento2-glow {
      0%, 100% {
        opacity: 0.7;
        filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0.4));
      }
      50% {
        opacity: 1;
        filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.35));
      }
    }
  </style>

  <!-- Ambient Grid & Radial Background -->
  <div class="absolute inset-0 -z-30 overflow-hidden pointer-events-none">
    <div
      class="absolute inset-0"
      style="background: radial-gradient(ellipse 55% 100% at 12% 0%, rgba(59, 130, 246, 0.12), transparent 65%), radial-gradient(ellipse 40% 80% at 88% 0%, rgba(251, 191, 36, 0.08), transparent 70%), #09090b;"
    ></div>

    <div
      class="absolute inset-0 opacity-40"
      style="
        background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        background-size: 24px 24px;
        mask-image: repeating-linear-gradient(to right, black 0px, black 3px, transparent 3px, transparent 8px), repeating-linear-gradient(to bottom, black 0px, black 3px, transparent 3px, transparent 8px);
        -webkit-mask-image: repeating-linear-gradient(to right, black 0px, black 3px, transparent 3px, transparent 8px), repeating-linear-gradient(to bottom, black 0px, black 3px, transparent 3px, transparent 8px);
        mask-composite: intersect;
        -webkit-mask-composite: source-in;
      "
    ></div>

    <div
      class="pointer-events-none absolute inset-0"
      style="background: radial-gradient(circle at center, rgba(0,0,0,0) 55%, #09090b 100%); filter: blur(40px); opacity: 0.85;"
    ></div>
  </div>

  <section class="relative mx-auto max-w-6xl px-4 sm:px-6">
    <!-- Header Section -->
    <header use:reveal class="mb-12 flex flex-col gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
      <div class="flex flex-col gap-2.5">
        <span class="text-xs uppercase tracking-[0.35em] text-amber-400 font-bold">
          FITUR UNGGULAN
        </span>
        <h2 class="text-3xl font-black tracking-tight text-white md:text-5xl font-headline">
          Ekosistem Finansial Cerdas
        </h2>
      </div>
      <div class="flex flex-col items-start gap-4 md:items-end">
        <p class="max-w-md text-sm text-zinc-400 md:text-base leading-relaxed">
          Semua fitur esensial untuk mencatat pengeluaran, mengatur anggaran, dan menjaga keamanan aset finansial Anda dalam satu tempat.
        </p>
      </div>
    </header>

    <!-- Bento Grid (6 Columns) -->
    <div class="grid grid-cols-1 gap-3.5 md:auto-rows-[minmax(130px,auto)] md:grid-cols-6">
      {#each features as feature, index}
        {@const span = spans[index]}

        <article
          use:reveal={{ delay: index * 80 }}
          class="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_28px_70px_rgba(0,0,0,0.55)] {span}"
        >
          <!-- Subtle Card Ambient Tint -->
          <div class="absolute inset-0 -z-10 overflow-hidden rounded-2xl">
            <div class="absolute inset-0 bg-white/[0.02]"></div>
            <div
              class="absolute inset-0 opacity-40 transition-opacity duration-500 group-hover:opacity-70"
              style="background: radial-gradient(ellipse 60% 120% at 12% 0%, rgba(251, 191, 36, 0.15), transparent 72%);"
            ></div>
          </div>

          <div class="flex items-start gap-4">
            <!-- Icon Container -->
            <div
              class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/5 transition-colors group-hover:border-amber-400/30 group-hover:bg-amber-400/10"
            >
              <span
                class="material-symbols-outlined text-2xl text-white transition-colors group-hover:text-amber-300"
                style="animation: {feature.animation};"
              >
                {feature.icon}
              </span>
            </div>

            <!-- Content Area -->
            <div class="flex-1 min-w-0">
              <header class="flex items-center gap-2 mb-2">
                <h3 class="text-base font-bold uppercase tracking-wide text-white font-headline">
                  {feature.title}
                </h3>
                {#if feature.meta}
                  <span
                    class="ml-auto rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-semibold flex-shrink-0"
                  >
                    {feature.meta}
                  </span>
                {/if}
              </header>

              <p class="text-sm leading-relaxed text-zinc-400">
                {feature.blurb}
              </p>

              <!-- Optional In-Card Previews -->
              {#if feature.previewType === 'ai-chips'}
                <div class="mt-5 flex flex-wrap gap-2 pt-2 border-t border-white/10">
                  <div class="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-emerald-400 text-sm">mic</span>
                    <span>"Kopi Janji Jiwa 28rb"</span>
                    <span class="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-md">AI Auto</span>
                  </div>
                  <div class="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sky-400 text-sm">receipt_long</span>
                    <span>Foto Struk Kasir</span>
                    <span class="text-[10px] font-bold text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded-md">OCR</span>
                  </div>
                </div>
              {:else if feature.previewType === 'theme-dots'}
                <div class="mt-4 flex items-center gap-2 pt-2 border-t border-white/10">
                  <span class="text-[11px] text-zinc-400 font-medium">Palet:</span>
                  <span class="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700 shadow-sm" title="Slate"></span>
                  <span class="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm" title="Emerald"></span>
                  <span class="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-sm" title="Gold"></span>
                  <span class="w-3.5 h-3.5 rounded-full bg-rose-400 shadow-sm" title="Sakura"></span>
                  <span class="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-sm" title="Cyberpunk"></span>
                </div>
              {/if}
            </div>
          </div>
        </article>
      {/each}
    </div>
  </section>
</div>

