'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login');
      else setEmail(data.user.email || '');
    });
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const items = [
    { href: '/echoes/create', title: 'Create Echo', desc: 'Write a future message' },
    { href: '/echoes/vault', title: 'Vault', desc: 'See and deliver Echoes' },
    { href: '/feed', title: 'Feed', desc: 'Posts, likes and comments' },
    { href: '/friends', title: 'Friends', desc: 'Add and accept friends' },
    { href: '/chat', title: 'Chat', desc: 'Message a friend' },
    { href: '/groups', title: 'Groups', desc: 'Create a group' },
    { href: '/notifications', title: 'Notifications', desc: 'See updates' },
    { href: '/profile', title: 'Profile', desc: 'Name, bio and photo' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <p className="text-sky-400 text-sm">HRM ECHO ROOM</p>
        <h1 className="mt-2 text-3xl font-bold">Home</h1>
        <p className="mt-2 text-slate-400">{email}</p>

        <div className="mt-8 grid gap-3">
          {items.map(item => (
            <Link key={item.href} href={item.href} className="rounded-2xl bg-white/10 p-4">
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </Link>
          ))}
          <button onClick={logout} className="rounded-2xl border border-white/20 p-4">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
