<script lang="ts">
  import { goto } from '$app/navigation';
  import { appStore } from '$lib/stores/app.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import TransactionItem from '$lib/components/transactions/TransactionItem.svelte';

  let recent = $derived(appStore.transactions.slice(0, 5));

  function handleEdit(id: string) {
    goto(`/tambah?edit=${id}`);
  }

  async function handleDelete(id: string) {
    try {
      await appStore.deleteTransaction(id);
      toast.success('Transaksi berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus transaksi');
    }
  }
</script>

<section class="space-y-3">
  <div class="flex justify-between items-center">
    <h2 class="font-headline text-base font-bold tracking-tight text-on-surface">Transaksi terakhir</h2>
    <a
      href="/riwayat"
      class="text-[10px] font-semibold text-primary/80 hover:text-primary uppercase tracking-[0.1em] active:scale-95 transition-all duration-150 flex items-center gap-0.5"
    >
      Lihat semua
      <span class="material-symbols-outlined text-[12px]">chevron_right</span>
    </a>
  </div>

  <div class="space-y-2">
    {#if appStore.isLoading}
      {#each [1, 2, 3] as _}
        <div class="h-[60px] rounded-2xl skeleton-wave"></div>
      {/each}
    {:else if recent.length > 0}
      {#each recent as trx (trx.id)}
        {@const isIncome = Number(trx.amount) < 0}
        {@const absoluteAmountStr = Math.abs(Number(trx.amount)).toLocaleString('id-ID')}
        <TransactionItem
          id={trx.id}
          icon={trx.category?.icon || 'payments'}
          category={trx.category?.name || 'Tanpa Kategori'}
          vendor={trx.note || 'Transaksi biasa'}
          amount={isIncome ? `+ Rp ${absoluteAmountStr}` : `- Rp ${absoluteAmountStr}`}
          date={new Date(trx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
          isIncome={isIncome}
          iconColorClass={isIncome ? 'text-secondary' : 'text-primary'}
          onEdit={() => handleEdit(trx.id)}
          onDelete={() => handleDelete(trx.id)}
        />
      {/each}
    {:else}
      <div class="flex flex-col items-center justify-center py-12 gap-3">
        <div class="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center">
          <span class="material-symbols-outlined text-on-surface-variant/30 text-[24px]">receipt_long</span>
        </div>
        <div class="text-center">
          <p class="text-sm font-semibold text-on-surface-variant/60">Belum ada transaksi</p>
          <p class="text-xs text-on-surface-variant/40 mt-0.5">Tambahkan transaksi pertamamu</p>
        </div>
      </div>
    {/if}
  </div>
</section>

