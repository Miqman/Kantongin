<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { format, parseISO } from "date-fns";
  import { id } from "date-fns/locale";
  import TopAppBar from "$lib/components/common/TopAppBar.svelte";
  import BottomNavBar from "$lib/components/common/BottomNavBar.svelte";
  import DatePickerModal from "$lib/components/common/DatePickerModal.svelte";
  import VoiceInputButton from "$lib/components/ai/VoiceInputButton.svelte";
  import PhotoInputButton from "$lib/components/ai/PhotoInputButton.svelte";
  import { appStore } from "$lib/stores/app.svelte";
  import { toast } from "$lib/stores/toast.svelte";

  let editId = $derived(page.url.searchParams.get("edit"));

  let transactionType = $state<"expense" | "income">("expense");
  let amount = $state("");
  let selectedCategoryId = $state("");
  let note = $state("");
  let date = $state(new Date().toISOString().slice(0, 10));

  let loading = $state(false);
  let showLoginDialog = $state(false);
  let showDatePicker = $state(false);

  // Set default category
  $effect(() => {
    if (appStore.categories.length > 0 && !selectedCategoryId && !editId) {
      selectedCategoryId = appStore.categories[0].id;
    }
  });

  // Populate form if editing
  $effect(() => {
    if (editId && appStore.transactions.length > 0) {
      const tx = appStore.transactions.find((t) => t.id === editId);
      if (tx) {
        transactionType = Number(tx.amount) < 0 ? "income" : "expense";
        amount = String(Math.abs(Number(tx.amount)));
        selectedCategoryId = tx.category_id;
        note = tx.note || "";
        date = tx.date;
      }
    }
  });

  function handleAmountChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const raw = target.value.replace(/\D/g, "");
    amount = raw;
  }

  function handleAIPrefill(data: {
    amount: string;
    categoryId: string;
    note: string;
    date: string;
    transactionType: "expense" | "income";
  }) {
    if (data.amount) amount = data.amount.replace(/\D/g, "");
    if (data.categoryId) selectedCategoryId = data.categoryId;
    if (data.note) note = data.note;
    if (data.date) date = data.date;
    transactionType = data.transactionType;
    toast.success("Form diisi otomatis oleh AI ✨");
  }

  async function handleSave() {
    if (
      !amount ||
      isNaN(Number(amount)) ||
      Number(amount) <= 0 ||
      !selectedCategoryId
    ) {
      toast.error("Masukkan nominal dan kategori yang valid.");
      return;
    }

    loading = true;
    try {
      const finalAmount =
        transactionType === "income"
          ? -Math.abs(Number(amount))
          : Math.abs(Number(amount));

      if (editId) {
        await appStore.updateTransaction(editId, {
          amount: finalAmount,
          category_id: selectedCategoryId,
          note,
          date,
        });
        toast.success("Transaksi berhasil diperbarui");
      } else {
        await appStore.addTransaction({
          amount: finalAmount,
          category_id: selectedCategoryId,
          note,
          date,
        });
        toast.success("Transaksi berhasil disimpan");
      }

      goto("/");
    } catch {
      toast.error("Gagal menyimpan transaksi");
    } finally {
      loading = false;
    }
  }

  const formattedDateDisplay = $derived.by(() => {
    if (!date) return "Pilih tanggal";
    try {
      const parsed = parseISO(date);
      if (isNaN(parsed.getTime())) return "Pilih tanggal";
      return format(parsed, "EEEE, d MMMM yyyy", { locale: id });
    } catch {
      return "Pilih tanggal";
    }
  });
</script>

<TopAppBar />

<main class="px-6 pt-8 max-w-lg mx-auto pb-24">
  <!-- Switch Income & Expense -->
  <div
    class="flex bg-surface-container-low rounded-full p-1.5 mb-8 max-w-[260px] mx-auto border border-outline-variant/20 shadow-sm"
  >
    <button
      type="button"
      onclick={() => (transactionType = "expense")}
      class="flex-1 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer {transactionType ===
      'expense'
        ? 'bg-primary text-on-primary shadow-md'
        : 'text-on-surface-variant hover:text-on-surface'}"
    >
      Pengeluaran
    </button>
    <button
      type="button"
      onclick={() => (transactionType = "income")}
      class="flex-1 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer {transactionType ===
      'income'
        ? 'bg-secondary text-on-secondary shadow-md'
        : 'text-on-surface-variant hover:text-on-surface'}"
    >
      Pemasukan
    </button>
  </div>

  <!-- Hero Amount Display -->
  <section class="mb-10 text-center">
    <label
      for="nominal-input"
      class="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant/70 mb-3 block font-semibold"
    >
      {transactionType === "expense"
        ? "Jumlah Pengeluaran"
        : "Jumlah Pemasukan"}
    </label>
    <div
      class="relative inline-flex items-baseline bg-surface-container-low/50 px-6 py-4 rounded-3xl mb-4"
    >
      <span
        class="font-headline text-2xl font-extrabold mr-2 {transactionType ===
        'expense'
          ? 'text-primary'
          : 'text-secondary'}"
      >
        Rp
      </span>
      <input
        id="nominal-input"
        type="text"
        inputmode="numeric"
        value={amount ? Number(amount).toLocaleString("id-ID") : ""}
        oninput={handleAmountChange}
        placeholder="0"
        autofocus
        class="bg-transparent border-none focus:ring-0 p-0 font-headline text-5xl font-extrabold w-full max-w-[240px] outline-none {transactionType ===
        'expense'
          ? 'text-on-surface selection:bg-primary/30'
          : 'text-secondary selection:bg-secondary/30'}"
      />
      <div
        class="absolute bottom-3 left-6 right-6 h-0.5 rounded-full {transactionType ===
        'expense'
          ? 'bg-primary/30'
          : 'bg-secondary/30'}"
      ></div>
    </div>

    <!-- AI Quick Input pills below amount -->
    <div class="flex justify-center items-center gap-3 mt-2">
      {#if appStore.user}
        <VoiceInputButton compact onPrefillForm={handleAIPrefill} />
        <PhotoInputButton compact onPrefillForm={handleAIPrefill} />
      {:else}
        <button
          type="button"
          onclick={() => (showLoginDialog = true)}
          class="relative flex items-center gap-2 px-5 py-2.5 rounded-full border bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all duration-200 cursor-pointer active:scale-95"
          aria-label="Input suara — login diperlukan"
        >
          <span class="material-symbols-outlined text-base">mic</span>
          <span class="text-xs font-bold tracking-wide">Input Suara</span>
          <span class="material-symbols-outlined text-[14px] opacity-60 ml-0.5"
            >lock</span
          >
        </button>
        <button
          type="button"
          onclick={() => (showLoginDialog = true)}
          class="relative flex items-center gap-2 px-5 py-2.5 rounded-full border bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20 hover:border-secondary/40 transition-all duration-200 cursor-pointer active:scale-95"
          aria-label="Input foto — login diperlukan"
        >
          <span class="material-symbols-outlined text-base">photo_camera</span>
          <span class="text-xs font-bold tracking-wide">Input Foto</span>
          <span class="material-symbols-outlined text-[14px] opacity-60 ml-0.5"
            >lock</span
          >
        </button>
      {/if}
    </div>
  </section>

  <!-- Dynamic Category Bento Grid (Exact 1:1 match with original Next.js design) -->
  <section class="mb-8">
    <h2 class="font-headline text-sm font-semibold text-on-surface mb-4 ml-1">
      Pilih Kategori
    </h2>
    {#if appStore.categories.length === 0}
      <p class="text-center text-on-surface-variant text-sm my-6">
        Memuat kategori...
      </p>
    {:else}
      <div class="grid grid-cols-4 gap-2">
        {#each appStore.categories as cat (cat.id)}
          {@const isSelected = selectedCategoryId === cat.id}
          <button
            type="button"
            onclick={() => (selectedCategoryId = cat.id)}
            class="flex flex-col items-center justify-center p-3 rounded-2xl transition-all border group cursor-pointer {isSelected
              ? 'bg-primary/10 border-primary/30 dark:bg-primary/15 dark:border-primary/40 ring-1 ring-primary/20'
              : 'bg-surface-container-lowest hover:bg-surface-container-low border-outline-variant/20 dark:bg-surface-container-low dark:border-outline-variant/10 dark:hover:bg-surface-container'}"
          >
            <div
              style="background-color: {cat.color}18;"
              class="w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform"
            >
              <span
                style="color: {cat.color};"
                class="material-symbols-outlined text-xl">{cat.icon}</span
              >
            </div>
            <span
              class="font-label text-[10px] font-semibold text-center leading-tight {isSelected
                ? 'text-primary dark:text-primary'
                : 'text-on-surface-variant'}"
            >
              {cat.name}
            </span>
          </button>
        {/each}
      </div>
    {/if}
  </section>

  <!-- Transaction Details -->
  <section class="space-y-4">
    <!-- Date Selector -->
    <button
      type="button"
      onclick={() => (showDatePicker = true)}
      class="w-full p-4 rounded-2xl flex items-center justify-start gap-3 border border-outline-variant/20 bg-surface-container-lowest hover:bg-surface-container-low active:scale-[0.99] shadow-sm transition-all text-sm font-body font-medium cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 group"
    >
      <div
        class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-105 transition-transform"
      >
        <span class="material-symbols-outlined text-lg">calendar_month</span>
      </div>
      <span class="text-on-surface font-medium flex-1">
        {formattedDateDisplay}
      </span>
      <span
        class="material-symbols-outlined text-on-surface-variant text-sm group-hover:text-primary transition-colors"
      >
        edit_calendar
      </span>
    </button>

    <DatePickerModal
      open={showDatePicker}
      value={date}
      onClose={() => (showDatePicker = false)}
      onChange={(newDate) => {
        date = newDate;
      }}
    />

    <!-- Note Field with Auto-Suggest chips -->
    <div class="space-y-3">
      <div
        class="bg-surface-container-lowest p-4 rounded-2xl flex items-center gap-3 border border-outline-variant/20 shadow-sm focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 transition-all"
      >
        <span
          class="material-symbols-outlined text-on-surface-variant/60 text-xl"
          >notes</span
        >
        <input
          bind:value={note}
          placeholder="Tambah catatan (opsional)"
          type="text"
          class="bg-transparent border-none focus:ring-0 p-0 text-sm w-full placeholder:text-on-surface-variant/50 outline-none text-on-surface font-medium"
        />
      </div>

      <!-- Auto-suggest chips -->
      <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {#each ["Makan Siang", "Gojek", "Coffee Break", "Belanja Bulanan"] as suggestion}
          <button
            type="button"
            onclick={() => (note = suggestion)}
            class="whitespace-nowrap px-4 py-2 rounded-full bg-surface-container-lowest border border-outline-variant/20 text-[11px] font-semibold text-primary hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer shadow-sm"
          >
            {suggestion}
          </button>
        {/each}
      </div>
    </div>
  </section>

  <!-- Action Controls -->
  <div class="mt-10">
    <button
      type="button"
      disabled={loading}
      onclick={handleSave}
      class="w-full py-5 rounded-full font-headline font-bold text-lg shadow-xl active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-wait cursor-pointer {transactionType ===
      'expense'
        ? 'bg-primary text-on-primary shadow-primary/25 hover:shadow-primary/40'
        : 'bg-secondary text-on-secondary shadow-secondary/25 hover:shadow-secondary/40'}"
    >
      {loading
        ? "Menyimpan..."
        : editId
          ? "Perbarui Transaksi"
          : "Simpan Transaksi"}
    </button>
  </div>
</main>

<BottomNavBar />

<!-- Dialog: Login diperlukan untuk fitur AI -->
{#if showLoginDialog}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-in fade-in"
    onclick={() => (showLoginDialog = false)}
    role="button"
    tabindex="0"
    onkeydown={(e) => {
      if (e.key === "Escape") showLoginDialog = false;
    }}
  ></div>
  <div
    class="fixed bottom-0 left-0 right-0 bg-surface rounded-t-3xl shadow-2xl z-[9999] p-6 max-w-lg mx-auto animate-in slide-in-from-bottom"
  >
    <div class="w-10 h-1 rounded-full bg-outline-variant/40 mx-auto mb-5"></div>
    <div class="text-center space-y-3 mb-6">
      <div
        class="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto"
      >
        <span class="material-symbols-outlined text-2xl">lock</span>
      </div>
      <h3 class="font-headline font-bold text-lg text-on-surface">
        Fitur AI Memerlukan Akun
      </h3>
      <p class="text-xs text-on-surface-variant leading-relaxed">
        Pencatatan pintar dengan suara & foto struk hanya tersedia untuk
        pengguna terdaftar.
      </p>
    </div>
    <div class="space-y-3">
      <a
        href="/login"
        class="w-full py-3.5 rounded-full bg-primary text-on-primary font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        Masuk Sekarang
      </a>
      <button
        type="button"
        onclick={() => (showLoginDialog = false)}
        class="w-full py-3 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
      >
        Nanti Saja
      </button>
    </div>
  </div>
{/if}
