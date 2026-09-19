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
      if (!data.user) {
        router.push('/auth/login');
      } else {
        setEmail(data.user.email || '');
      }
    });
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-bold">Welcome to HRM ECHO ROOM</h1>
        <p className="mt-2 text-slate-600">Logged in as {email}</p>

        <div className="mt-6 flex flex-col gap-3">
          <Link href="/echoes/create" className="px-4 py-3 rounded-xl bg-sky-500 text-white text-center font-semibold">
            Create Echo
          </Link>
          <Link href="/echoes/vault" className="px-4 py-3 rounded-xl bg-slate-900 text-white text-center font-semibold">
            Open Vault
          </Link>
         
                    <Link href="/profile" className="px-4 py-3 rounded-xl bg-indigo-600 text-white text-center font-semibold">
            Profile
          </Link>
          <button onClick={logout} className="px-4 py-3 rounded-xl border font-semibold">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
