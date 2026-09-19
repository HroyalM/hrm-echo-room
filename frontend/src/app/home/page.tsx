'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

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
        <p className="mt-4">Your app is working. Next we can add Create Echo and the Vault.</p>
        <button onClick={logout} className="mt-6 px-4 py-2 rounded-full bg-slate-900 text-white">
          Log out
        </button>
      </div>
    </div>
  );
}
