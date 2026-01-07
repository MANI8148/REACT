'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, MemoryStick, HardDrive, Share2, Activity, Play } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { startSimulation } from '@/store/slices/simulationSlice';

export default function Home() {
  const dispatch = useDispatch();
  const { isRunning } = useSelector((state: RootState) => state.simulation);

  const modules = [
    { title: 'CPU Scheduling', icon: <Cpu className="w-8 h-8 text-blue-400" />, href: '/cpu', desc: 'Simulate FCFS, Round Robin, SRTF with real-time Gantt charts.' },
    { title: 'Memory Management', icon: <MemoryStick className="w-8 h-8 text-purple-400" />, href: '/ram', desc: 'Visualize Paging, Segmentation, and Thashing.' },
    { title: 'File System', icon: <HardDrive className="w-8 h-8 text-green-400" />, href: '/fs', desc: 'Explore Inodes, FAT, and Directory structures.' },
    { title: 'Threads & Semaphores', icon: <Share2 className="w-8 h-8 text-indigo-400" />, href: '/threads', desc: 'Producer-Consumer, Dining Philosophers & Synchronization.' },
    { title: 'Deadlock Detection', icon: <Share2 className="w-8 h-8 text-red-400" />, href: '/deadlock', desc: 'Banker\'s algorithm and Resource Allocation Graphs.' },
  ];

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      {/* Header */}
      <nav className="flex justify-between items-center mb-16">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">OSLabX</h1>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => dispatch(startSimulation())}
            disabled={isRunning}
            className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${isRunning
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30'
              }`}
          >
            {isRunning ? <> <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Live </> : <> <Play size={18} /> Run Simulator </>}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center mb-24 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 blur-[100px] -z-10 rounded-full" />
        <h2 className="text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
          The Ultimate OS <br /> Simulation Lab.
        </h2>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto">
          Deep dive into the internals of modern Operating Systems.
          Powered by WASM-accelerated algorithms and real-time Socket.IO synchronization.
        </p>
      </section>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((m) => (
          <Link
            key={m.title}
            href={m.href}
            className="group p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer shadow-xl"
          >
            <div className="mb-6 p-4 rounded-2xl bg-slate-950 inline-block group-hover:scale-110 transition-transform">
              {m.icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{m.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{m.desc}</p>
          </Link>
        ))}
      </div>

      {/* Feature Highlight */}
      <section className="mt-32 p-12 rounded-[40px] bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex flex-col items-center text-center">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500 mb-4 px-3 py-1 bg-blue-500/10 rounded-full">Coming Soon</div>
        <h3 className="text-3xl font-bold mb-6">Algorithm Core in C++</h3>
        <p className="text-slate-400 max-w-xl mb-8 leading-relaxed">
          We leverage the power of C++ compiled to WebAssembly to handle thousands of concurrent process simulations with microsecond accuracy.
        </p>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm font-mono">WASM 1.0</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-mono">Node.js Sync</span>
          </div>
        </div>
      </section>
    </main>
  );
}
