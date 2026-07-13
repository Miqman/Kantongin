"use client";
import TopAppBar from '@/components/TopAppBar';
import HeroSection from '@/components/HeroSection';
import SpendingChart from '@/components/SpendingChart';
import RecentTransactions from '@/components/RecentTransactions';
import GuestMigrationBanner from '@/components/GuestMigrationBanner';
import BottomNavBar from '@/components/BottomNavBar';

export default function Home() {
  return (
    <>
      <TopAppBar />
      <main id="main-content" className="px-5 pt-6 pb-8 max-w-2xl mx-auto space-y-8">
        <HeroSection />
        <GuestMigrationBanner />
        <SpendingChart />
        <RecentTransactions />
      </main>
      <BottomNavBar />
    </>
  );
}
