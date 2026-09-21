'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AppChrome from '@/components/AppChrome';

type Block = { id: string; blocked_email: string };

export default function SettingsPage() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [theme, setTheme] = useState('dark');
  const [sound, setSound] = useState(true);
  const [password, setPassword] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [form, setForm] = useState({
    privacy_profile: 'public',
    privacy_friends: 'friends',
    privacy_posts: 'friends',
    privacy_echoes: 'friends',
    email_visibility: 'private',
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('echo-theme') || 'dark';
    const savedSound = localStorage.getItem('echo-sound') !== 'off';
    setTheme(savedTheme);
    setSound(savedSound);
    document.documentElement.classList.toggle('light', savedTheme === 'light');

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      setId(data.user.id);
      setEmail(data.user.email || '');
      const { data: row } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      if (row) {
        setAvatar(row.avatar_url || '');
        setForm({
          privacy_profile: row.privacy_profile || 'public',
          privacy_friends: row.privacy_friends || 'friends',
          privacy_posts: row.privacy_posts || 'friends',
          privacy_echoes: row.privacy_echoes || 'friends',
          email_visibility: row.email_visibility || 'private',
        });
      }
      const { data: b } = await supabase.from('blocks').select('id, blocked_email').eq('blocker_id', data.user.id);
      setBlocks(b || []);
    });
  }, [router]);

  const changeTheme = (value: string) => {
    setTheme(value);
    localStorage.setItem('echo-theme', value);
    document.documentElement.classList.toggle('light', value === 'light');
    toast.success(value === 'light' ? 'Light theme on' : 'Dark theme on');
  };

  const changeSound = (on: boolean) => {
    setSound(on);
    localStorage.setItem('echo-sound', on ? 'on' : 'off');
    toast.success(on ? 'Sounds on' : 'Sounds off');
  };

  const savePrivacy = async () => {
    const { error } = await supabase.from('profiles').update(form).eq('id', id);
    if (error) toast.error(error.message);
    else toast.success('Privacy saved');
  };

  const changePassword = async () => {
    if (password.length < 6) { toast.error('Use 6+ characters'); return; }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else { toast.success('Password updated'); setPassword(''); }
  };

  const enableAlerts = async () => {
    if (!('Notification' in window)) { toast.error('This browser has no alerts'); return; }
    const res = await Notification.requestPermission();
    if (res === 'granted') {
      new Notification('Echo alerts on', { body: 'You will see message banners when the app is open.' });
      toast.success('Alerts allowed');
    } else toast.error('Alerts blocked by the phone');
  };

  const unblock = async (row: Block) => {
    await supabase.from('blocks').delete().eq('id', row.id);
    setBlocks(blocks.filter(b => b.id !== row.id));
    toast.success('Unblocked');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const Field = ({ label, keyName }: { label: string; keyName: keyof typeof form }) => (
    <label className="block">
      <span className="text-sm text-slate-400">{label}</span>
      <select value={form[keyName]} onChange={e => setForm({ ...form, [keyName]: e.target.value })} className="mt-1 w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none">
        <option value="public">Public</option>
        <option value="friends">Friends</option>
        <option value="private">Only me</option>
      </select>
    </label>
  );

  return (
    <AppChrome avatar={avatar}>
      <div className="max-w-xl mx-auto p-4 space-y-4 pb-10">
        <h1 className="text-2xl font-bold">Settings & privacy</h1>
        <p className="text-sm text-slate-400">{email}</p>

        <section className="rounded-2xl bg-[#242526] p-4 space-y-3">
          <h2 className="font-bold">Account</h2>
          <Link href="/profile" className="block py-2">Edit profile</Link>
          <Link href="/auth/reset" className="block py-2">Reset password page</Link>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
          <button onClick={changePassword} className="w-full py-3 rounded-xl bg-[#3a3b3c]">Update password now</button>
        </section>

        <section className="rounded-2xl bg-[#242526] p-4 space-y-3">
          <h2 className="font-bold">Theme</h2>
          <select value={theme} onChange={e => changeTheme(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c]">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </section>

        <section className="rounded-2xl bg-[#242526] p-4 space-y-3">
          <h2 className="font-bold">Notifications</h2>
          <button onClick={enableAlerts} className="w-full py-3 rounded-xl bg-[#3a3b3c]">Allow phone banners</button>
          <label className="flex items-center justify-between">
            <span>Chat sounds</span>
            <input type="checkbox" checked={sound} onChange={e => changeSound(e.target.checked)} />
          </label>
        </section>

        <section className="rounded-2xl bg-[#242526] p-4 space-y-3">
          <h2 className="font-bold">Who can see what</h2>
          <Field label="Profile" keyName="privacy_profile" />
          <Field label="Friends list" keyName="privacy_friends" />
          <Field label="Posts" keyName="privacy_posts" />
          <Field label="Echoes" keyName="privacy_echoes" />
          <Field label="Email" keyName="email_visibility" />
          <button onClick={savePrivacy} className="w-full py-3 rounded-xl bg-[#0866ff] font-semibold">Save privacy</button>
        </section>

        <section className="rounded-2xl bg-[#242526] p-4 space-y-3">
          <h2 className="font-bold">Blocked</h2>
          {blocks.length === 0 && <p className="text-sm text-slate-400">Nobody blocked.</p>}
          {blocks.map(b => (
            <div key={b.id} className="flex justify-between">
              <span>{b.blocked_email}</span>
              <button onClick={() => unblock(b)} className="text-[#0866ff] text-sm">Unblock</button>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-[#242526] p-4 space-y-3">
          <Link href="/friends" className="block">Friends</Link>
          <Link href="/people" className="block">Find people</Link>
          <Link href="/notifications" className="block">Notifications</Link>
          <button onClick={logout} className="text-red-400">Log out</button>
        </section>
      </div>
    </AppChrome>
  );
}
