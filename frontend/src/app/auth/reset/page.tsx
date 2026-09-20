'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ResetPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else {
      toast.success('Password updated');
      router.push('/auth/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <form onSubmit={save} className="w-full max-w-md p-8 rounded-2xl bg-white/5 space-y-4">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
          placeholder="New password" className="w-full px-4 py-3 rounded-xl bg-white/10" />
        <button disabled={loading} className="w-full py-3 rounded-xl bg-sky-500 font-semibold">
          {loading ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </div>
  );
}
