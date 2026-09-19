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

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <p className="text-sky-400 text-sm">HRM ECHO ROOM</p>
        <h1 className="mt-2 text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-slate-400">{email}</p>

        <div className="mt-8 grid gap-4">
          <Link href="/echoes/create" className="rounded-3xl bg-sky-500 p-5 font-semibold">
            Create Echo
            <p className="text-sm font-normal text-sky-100 mt-1">Write a message for the future</p>
          </Link>
          <Link href="/echoes/vault" className="rounded-3xl bg-white/10 p-5 font-semibold">
            Open Vault
            <p className="text-sm font-normal text-slate-300 mt-1">See all your sealed messages</p>
          </Link>
          <Link href="/profile" className="rounded-3xl bg-violet-600 p-5 font-semibold">
            Profile
            <p className="text-sm font-normal text-violet-100 mt-1">Edit your name and photo</p>
          </Link>
          <Link href="/feed" className="rounded-3xl bg-white/10 p-5 font-semibold">
            Feed
            <p className="text-sm font-normal text-slate-300 mt-1">See and share posts</p>
          </Link>
          <Link href="/friends" className="rounded-3xl bg-white/10 p-5 font-semibold">
            Friends
            <p className="text-sm font-normal text-slate-300 mt-1">Add and accept friends</p>
          </Link>
          <button onClick={logout} className="rounded-3xl border border-white/20 p-4">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
