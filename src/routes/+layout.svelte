<script lang="ts">
  import './layout.css';
  import { untrack } from 'svelte';
  import { appStore } from '$lib/stores/app.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import Toaster from '$lib/components/common/Toaster.svelte';
  import type { LayoutProps } from './$types';

  let { data, children }: LayoutProps = $props();

  $effect(() => {
    const user = data.user;
    untrack(() => {
      appStore.init(user);
      if (user) {
        themeStore.fetchEntitlements();
      }
    });
  });
</script>

<Toaster />

{@render children()}
