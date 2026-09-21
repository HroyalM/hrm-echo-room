'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_status')
      .eq('id', data.user.id)
      .single();
    if (profile?.account_status === 'suspended' || profile?.account_status === 'disabled') {
      await supabase.auth.signOut();
      toast.error('This account is ' + profile.account_status);
      setLoading(false);
      return;
    }
    router.push('/home');
    setLoading(false);
  };

  const forgot = async () => {
    if (!email) {
      toast.error('Enter your email first');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://echo-room-2026.vercel.app/auth/reset',
    });
    if (error) toast.error(error.message);
    else toast.success('Check your email for the reset link');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5">
        <h1 className="text-2xl font-bold mb-6">Welcome back</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-white/10" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-white/10" />
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-sky-500 font-semibold">
            {loading ? 'Signing in…' : 'Log in'}
          </button>
        </form>
        <button onClick={forgot} className="mt-4 text-sm text-sky-400">Forgot password?</button>
        <p className="mt-6 text-center text-sm text-slate-400">
          No account? <Link href="/auth/register" className="text-sky-400">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
