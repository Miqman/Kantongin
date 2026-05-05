'use client'
import { createBrowserClient } from '@supabase/ssr'

// Singleton: semua komponen harus pakai instance yang SAMA
// agar onAuthStateChange di AppInitializer bisa menerima event
// dari login/logout yang dilakukan komponen lain
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}
