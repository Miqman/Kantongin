<script lang="ts">
  import TopAppBar from "$lib/components/common/TopAppBar.svelte";
  import BottomNavBar from "$lib/components/common/BottomNavBar.svelte";
  import HeroSection from "$lib/components/dashboard/HeroSection.svelte";
  import GuestMigrationBanner from "$lib/components/common/GuestMigrationBanner.svelte";
  import SpendingChart from "$lib/components/dashboard/SpendingChart.svelte";
  import RecentTransactions from "$lib/components/dashboard/RecentTransactions.svelte";
</script>

<TopAppBar />

<main id="main-content" class="px-5 pt-6 pb-24 max-w-2xl mx-auto space-y-8">
  <HeroSection />
  <GuestMigrationBanner />
  <SpendingChart />
  <RecentTransactions />
</main>

<BottomNavBar />
