'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/auth/login');
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('display_name, bio, avatar_url')
        .eq('id', userData.user.id)
        .single();
      setDisplayName(data?.display_name || '');
      setBio(data?.bio || '');
      setAvatarUrl(data?.avatar_url || '');
      setLoading(false);
    };
    load();
  }, [router]);

  const uploadPhoto = async (file: File) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const path = `${userData.user.id}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(path, file);
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    toast.success('Photo uploaded');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName, bio, avatar_url: avatarUrl })
      .eq('id', userData.user.id);
    if (error) toast.error(error.message);
    else toast.success('Profile saved');
  };

  if (loading) return <p className="min-h-screen bg-slate-950 text-white p-6">Loading…</p>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/home" className="text-sky-400 text-sm">← Back</Link>
        <h1 className="mt-4 text-3xl font-bold">Profile</h1>

        <div className="mt-6 flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/10 overflow-hidden">
            {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : null}
          </div>
          <input type="file" accept="image/*" onChange={e => e.target.files && uploadPhoto(e.target.files[0])} />
        </div>

        <form onSubmit={save} className="mt-6 space-y-4">
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display name"
            className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" rows={4}
            className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <button className="w-full py-3 rounded-2xl bg-sky-500 font-semibold">Save</button>
        </form>
      </div>
    </div>
  );
}
