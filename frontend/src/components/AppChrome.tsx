'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AppChrome({
  children,
  avatar,
  unread = 0,
}: {
  children: React.ReactNode;
  avatar?: string;
  unread?: number;
}) {
  const path = usePathname();
  const router = useRouter();
  const tab = (href: string) => path === href ? 'text-[#0866ff]' : 'text-slate-300';

  return (
    <div className="min-h-screen bg-[#18191a] text-white pb-16">
      <header className="sticky top-0 z-30 bg-[#242526] border-b border-white/10 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {path !== '/home' && (
            <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-[#3a3b3c]">←</button>
          )}
          <Link href="/home" className="text-2xl font-bold text-[#0866ff]">echo</Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/search" className="w-10 h-10 rounded-full bg-[#3a3b3c] flex items-center justify-center">⌕</Link>
          <Link href="/chat" className="w-10 h-10 rounded-full bg-[#3a3b3c] flex items-center justify-center">💬</Link>
          <Link href="/notifications" className="relative w-10 h-10 rounded-full bg-[#3a3b3c] flex items-center justify-center">
            🔔
            {unread > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px]">{unread}</span>}
          </Link>
          <Link href="/settings" className="w-10 h-10 rounded-full bg-[#3a3b3c] flex items-center justify-center">⚙️</Link>
          <Link href="/profile" className="w-10 h-10 rounded-full overflow-hidden bg-[#3a3b3c]">
            {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <span className="flex h-full items-center justify-center">🙂</span>}
          </Link>
        </div>
      </header>
      {children}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-[#242526] border-t border-white/10 grid grid-cols-5 text-center text-[11px] py-2">
        <Link href="/home" className={tab('/home')}>🏠<br />Home</Link>
        <Link href="/friends" className={tab('/friends')}>👥<br />Friends</Link>
        <Link href="/echoes/create" className={tab('/echoes/create')}>＋<br />Create</Link>
        <Link href="/notifications" className={tab('/notifications')}>🔔<br />Alerts</Link>
        <Link href="/profile" className={tab('/profile')}>🙂<br />Me</Link>
      </nav>
    </div>
  );
}
