"use client";
import React, { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import TopAppBar from '@/components/TopAppBar';
import HeroSection from '@/components/HeroSection';
import SpendingChart from '@/components/SpendingChart';
import RecentTransactions from '@/components/RecentTransactions';
import BottomNavBar from '@/components/BottomNavBar';

export default function Home() {
  const fetchData = useStore(state => state.fetchData);

  useEffect(() => {
    fetchData(); // Fetch exactly once when Dashboard mounts
  }, [fetchData]);

  return (
    <>
      <TopAppBar />
      <main className="px-6 py-8 max-w-2xl mx-auto space-y-10">
        <HeroSection />
        <SpendingChart />
        <RecentTransactions />
      </main>
      <BottomNavBar />
    </>
  );
}
