'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center font-bold text-lg">E</div>
          <div>
            <p className="font-semibold">HRM ECHO ROOM</p>
            <p className="text-xs text-slate-400">Leave a message. Meet it in the future.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/auth/login" className="px-4 py-2 rounded-full text-sm hover:bg-white/10">Log in</Link>
          <Link href="/auth/register" className="px-5 py-2 rounded-full text-sm bg-sky-500 hover:bg-sky-400">Sign up</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-16 pb-24">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-sky-400 text-sm tracking-widest uppercase">A digital time capsule</p>
          <h1 className="mt-4 text-4xl sm:text-6xl font-bold leading-tight">
            Leave a message.<br />
            <span className="bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
              Meet it in the future.
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
            Write something today for yourself or someone you love.
            HRM ECHO ROOM keeps it safe and delivers it when the time comes.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="px-8 py-4 rounded-full bg-sky-500 hover:bg-sky-400 font-semibold shadow-lg shadow-sky-500/20">
              Create your first Echo
            </Link>
            <Link href="/auth/login" className="px-8 py-4 rounded-full border border-white/20 hover:bg-white/10 font-semibold">
              I already have an account
            </Link>
          </div>
        </motion.div>

        <div className="mt-20 grid md:grid-cols-3 gap-6">
          {[
            { title: 'Write', text: 'Create a private message, a memory, or a promise.' },
            { title: 'Seal', text: 'Choose the date it should open. Days, months, or years later.' },
            { title: 'Receive', text: 'When the time comes, the Echo returns to you or a friend.' },
          ].map(item => (
            <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-slate-300">{item.text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
