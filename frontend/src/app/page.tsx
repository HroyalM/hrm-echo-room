'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center font-bold text-lg">E</div>
          <span className="text-xl font-semibold">HRM ECHO ROOM</span>
        </div>
        <div className="flex gap-3">
          <Link href="/auth/login" className="px-4 py-2 rounded-full text-sm hover:bg-white/10">Log in</Link>
          <Link href="/auth/register" className="px-5 py-2 rounded-full text-sm bg-sky-500 hover:bg-sky-400">Sign up</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-16 pb-24 text-center">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl sm:text-5xl md:text-6xl font-bold max-w-3xl mx-auto leading-tight">
          Leave a message.<br />
          <span className="bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">Meet it in the future.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6 text-lg text-slate-300 max-w-xl mx-auto">
          Create digital Echoes for yourself or the people you care about. Delivered days, months, or years from now.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register" className="px-8 py-3.5 rounded-full bg-sky-500 hover:bg-sky-400 font-semibold shadow-lg shadow-sky-500/25">
            Create your first Echo
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
