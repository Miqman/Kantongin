'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import TopAppBar from '@/components/TopAppBar';
import BottomNavBar from '@/components/BottomNavBar';
import { toast } from 'react-hot-toast';

const ICON_PRESETS = [
  'restaurant', 'shopping_cart', 'directions_car', 'payments', 'movie', 
  'medical_services', 'school', 'home', 'flight', 'fitness_center',
  'shopping_bag', 'receipt_long', 'local_gas_station', 'redeem', 'account_balance_wallet'
];

const COLOR_PRESETS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', 
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', 
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
];

export default function ManageCategories() {
  const router = useRouter();
  const { categories, addCategory, deleteCategory, updateCategory, fetchCategories } = useStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICON_PRESETS[0]);
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenModal = (cat: any = null) => {
    if (cat) {
      setEditingCategory(cat);
      setName(cat.name);
      setIcon(cat.icon);
      setColor(cat.color);
    } else {
      setEditingCategory(null);
      setName('');
      setIcon(ICON_PRESETS[0]);
      setColor(COLOR_PRESETS[0]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name, icon, color });
        toast.success('Kategori berhasil diperbarui');
      } else {
        await addCategory({ name, icon, color });
        toast.success('Kategori berhasil ditambahkan');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Gagal menyimpan kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus kategori ini? Transaksi dengan kategori ini mungkin akan terpengaruh.')) return;
    
    try {
      await deleteCategory(id);
      toast.success('Kategori berhasil dihapus');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Gagal menghapus kategori');
    }
  };

  return (
    <>
      <TopAppBar />
      <main className="max-w-2xl mx-auto px-6 pt-8 pb-32 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">Kelola Kategori</h2>
            <p className="text-on-surface-variant text-sm">Sesuaikan kategori pengeluaran Anda</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="w-12 h-12 rounded-2xl bg-primary text-on-primary shadow-lg shadow-primary/20 flex items-center justify-center active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </header>

        <section className="space-y-4">
          <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant/70 ml-1">Kategori Anda</h3>
          <div className="grid grid-cols-1 gap-3">
            {categories.map((cat) => (
              <div 
                key={cat.id} 
                className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/5 flex items-center justify-between group animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  >
                    <span className="material-symbols-outlined">{cat.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface">{cat.name}</h4>
                    {cat.is_default && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-bold uppercase tracking-tighter">
                        Default
                      </span>
                    )}
                  </div>
                </div>

                {!cat.is_default && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenModal(cat)}
                      className="w-10 h-10 rounded-full hover:bg-primary/10 text-primary transition-colors flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(cat.id)}
                      className="w-10 h-10 rounded-full hover:bg-error/10 text-error transition-colors flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── MODAL ADD/EDIT ── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
              className="w-full max-w-md bg-surface p-8 rounded-t-[40px] sm:rounded-[40px] shadow-2xl animate-in slide-in-from-bottom-full duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto mb-8 sm:hidden" />
              
              <div className="mb-8">
                <h3 className="font-headline text-2xl font-bold">{editingCategory ? 'Edit Kategori' : 'Kategori Baru'}</h3>
                <p className="text-on-surface-variant text-sm">Pilih nama, ikon, dan warna yang sesuai</p>
              </div>

              <form onSubmit={handleSave} className="space-y-8">
                <div className="space-y-2">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant/80 ml-1">Nama Kategori</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Misal: Jajan Sore"
                    required
                    className="w-full bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant/80 ml-1">Pilih Ikon</label>
                  <div className="grid grid-cols-5 gap-3">
                    {ICON_PRESETS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIcon(ic)}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                          icon === ic ? 'bg-primary text-on-primary scale-110 shadow-md' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">{ic}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant/80 ml-1">Pilih Warna</label>
                  <div className="grid grid-cols-8 gap-3">
                    {COLOR_PRESETS.map((cl) => (
                      <button
                        key={cl}
                        type="button"
                        onClick={() => setColor(cl)}
                        className={`w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-surface ${
                          color === cl ? 'ring-2 ring-primary scale-125' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: cl }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl bg-surface-container-high font-bold active:scale-95 transition-transform"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-2 py-4 rounded-2xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : (editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <BottomNavBar />
    </>
  );
}
