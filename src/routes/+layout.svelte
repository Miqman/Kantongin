<script lang="ts">
  import './layout.css';
  import { appStore } from '$lib/stores/app.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import Toaster from '$lib/components/common/Toaster.svelte';
  import type { LayoutProps } from './$types';

  let { data, children }: LayoutProps = $props();

  $effect(() => {
    appStore.init(data.user);
    themeStore.fetchEntitlements();
  });
</script>

<Toaster />

{@render children()}
