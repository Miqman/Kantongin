"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', icon: 'home', label: 'Beranda' },
  { href: '/tambah', icon: 'add_circle', label: 'Tambah' },
  { href: '/riwayat', icon: 'history', label: 'Riwayat' },
  { href: '/profil', icon: 'person', label: 'Profil' },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-t border-outline-variant/10"
    >
      <div className="flex justify-around items-center px-1 pt-1 pb-2 max-w-2xl mx-auto">
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all duration-200 active:scale-95"
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active background pill behind icon */}
              <span
                className={`relative flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200
                  ${isActive ? 'bg-primary/12' : ''}`}
              >
                <span
                  className={`material-symbols-outlined transition-all duration-200 ${isActive ? 'text-primary' : 'text-on-surface-variant/50'}`}
                  style={{
                    fontSize: '22px',
                    fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 300",
                  }}
                >
                  {icon}
                </span>
              </span>

              <span className={`text-[10px] tracking-wide transition-all duration-200 ${isActive ? 'font-semibold text-primary' : 'font-medium text-on-surface-variant/50'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
