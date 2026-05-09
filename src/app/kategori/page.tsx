"use client";
import React, { useState } from 'react';
import TopAppBar from '@/components/TopAppBar';
import BottomNavBar from '@/components/BottomNavBar';
import { useStore } from '@/store/useStore';
import { toast } from 'react-hot-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function KategoriPage() {
  const { categories, addCategory, deleteCategory } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('category');
  const [newCatColor, setNewCatColor] = useState('#2196f3');
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    setLoading(true);
    try {
      await addCategory({
        name: newCatName,
        icon: newCatIcon,
        color: newCatColor,
      });
      setIsAdding(false);
      setNewCatName('');
      toast.success('Kategori berhasil ditambahkan');
    } catch (error) {
      toast.error('Gagal menambah kategori');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      toast.error('Kategori bawaan tidak dapat dihapus');
      return;
    }
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget);
      toast.success('Kategori berhasil dihapus');
    } catch (error) {
      toast.error('Gagal menghapus kategori');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <TopAppBar />
      <main className="px-6 pt-8 max-w-lg mx-auto pb-32">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight mb-1">Kategori</h1>
            <p className="text-on-surface-variant text-sm font-medium">Kelola label untuk transaksi Anda</p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">{isAdding ? 'close' : 'add'}</span>
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAdd} className="bg-surface-container-low p-5 rounded-2xl mb-8 space-y-4 border border-outline-variant/10 shadow-sm animate-in slide-in-from-top-4">
            <h2 className="font-headline font-bold text-lg">Tambah Kategori Baru</h2>
            
            <div className="space-y-1">
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant/80">Nama</label>
              <input 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Cth: Belanja Online"
                className="w-full bg-surface-container-high rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                required
              />
            </div>
            
            <div className="flex gap-4">
              <div className="space-y-1 flex-1">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant/80">Ikon</label>
                <input 
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  placeholder="Kode material icon"
                  className="w-full bg-surface-container-high rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
                <a href="https://fonts.google.com/icons" target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline">Cari ikon di sini</a>
              </div>
              <div className="space-y-1">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant/80">Warna</label>
                <input 
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-14 h-12 bg-surface-container-high rounded-xl outline-none cursor-pointer p-1"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 rounded-full bg-primary text-on-primary font-bold text-sm shadow-md mt-2 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Kategori'}
            </button>
          </form>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div key={cat.id} className="relative group flex flex-col items-center justify-center p-5 rounded-3xl bg-surface-container-low border border-outline-variant/5">
              <div style={{ backgroundColor: `${cat.color}20` }} className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3">
                <span style={{ color: cat.color }} className="material-symbols-outlined text-2xl">{cat.icon}</span>
              </div>
              <span className="font-label text-xs font-bold text-center text-on-surface truncate w-full">{cat.name}</span>
              
              {!cat.is_default && (
                <button 
                  onClick={() => handleDelete(cat.id, cat.is_default)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-error/10 text-error flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
      <BottomNavBar />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-3xl border-none bg-surface-container-high p-6 ring-0 shadow-2xl">
          <AlertDialogHeader className="text-left place-items-start">
            <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-error text-2xl">delete</span>
            </div>
            <AlertDialogTitle className="font-headline text-xl font-bold text-on-surface">Hapus Kategori</AlertDialogTitle>
            <AlertDialogDescription className="text-on-surface-variant text-sm">
              Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 border-none bg-transparent p-0 pt-4 mx-0 mb-0 rounded-none">
            <AlertDialogCancel className="flex-1 py-3 rounded-full border-outline-variant/20 bg-surface-container-low font-bold text-on-surface hover:bg-surface-container-highest">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="flex-1 py-3 rounded-full bg-error text-on-error font-bold shadow-md shadow-error/20 hover:bg-error/90 border-none cursor-pointer">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
