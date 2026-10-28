import type { SupabaseClient, User, Session } from '@supabase/supabase-js';
import type { AppUser } from '$lib/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			user: AppUser | null;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
		}
		interface PageData {
			user?: AppUser | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
