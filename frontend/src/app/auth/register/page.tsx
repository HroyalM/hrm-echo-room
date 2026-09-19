'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created. Check your email if confirmation is required.');
      router.push('/auth/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 text-white">
        <h1 className="text-2xl font-bold mb-6">Create your HRM ECHO ROOM account</h1>
        <form onSubmit={handleRegister} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-sm" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-sm" />
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 font-semibold disabled:opacity-60">
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account? <Link href="/auth/login" className="text-sky-400">Log in</Link>
        </p>
      </div>
    </div>
  );
}
