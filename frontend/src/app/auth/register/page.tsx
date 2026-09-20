'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    date_of_birth: '',
    gender: '',
    email_visibility: 'private',
  });

  const setField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const username = form.username.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');
    if (username.length < 3) {
      toast.error('Username must be at least 3 letters');
      setLoading(false);
      return;
    }

    const { data: taken } = await supabase.from('profiles').select('id').ilike('username', username).maybeSingle();
    if (taken) {
      toast.error('That username is already taken');
      setLoading(false);
      return;
    }

    const fullName = `${form.first_name} ${form.last_name}`.trim();
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: fullName, username } },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from('profiles').update({
        username,
        full_name: fullName,
        display_name: fullName,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender,
        email_visibility: form.email_visibility,
      }).eq('id', data.user.id);
    }

    toast.success('Account created');
    router.push('/auth/login');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md p-6 rounded-3xl bg-white/5">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="mt-1 text-sm text-slate-400">People can share the same name, but not the same username.</p>

        <form onSubmit={handleRegister} className="mt-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input required value={form.first_name} onChange={e => setField('first_name', e.target.value)} placeholder="First name" className="px-4 py-3 rounded-2xl bg-white/10 outline-none" />
            <input required value={form.last_name} onChange={e => setField('last_name', e.target.value)} placeholder="Last name" className="px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          </div>
          <input required value={form.username} onChange={e => setField('username', e.target.value)} placeholder="Username" className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <input required type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="Email" className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <input required type="password" value={form.password} onChange={e => setField('password', e.target.value)} placeholder="Password" className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <div>
            <label className="block mb-1 text-sm text-slate-400">Date of birth</label>
            <input type="date" value={form.date_of_birth} onChange={e => setField('date_of_birth', e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          </div>
          <select value={form.gender} onChange={e => setField('gender', e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-slate-900 outline-none">
            <option value="">Gender</option>
            <option>Female</option>
            <option>Male</option>
            <option>Non-binary</option>
            <option>Prefer not to say</option>
          </select>
          <div>
            <label className="block mb-1 text-sm text-slate-400">Who can see your email</label>
            <select value={form.email_visibility} onChange={e => setField('email_visibility', e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-slate-900 outline-none">
              <option value="private">Only me</option>
              <option value="friends">Friends only</option>
              <option value="public">Public</option>
            </select>
          </div>
          <button disabled={loading} className="w-full py-3 rounded-2xl bg-sky-500 font-semibold">
            {loading ? 'Creating…' : 'Sign up'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account? <Link href="/auth/login" className="text-sky-400">Log in</Link>
        </p>
      </div>
    </div>
  );
}
