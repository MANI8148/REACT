'use client';

import React, { useState } from 'react';
import GanttChart from '@/components/simulations/cpu/GanttChart';
import { Play, Pause, RotateCcw, Plus } from 'lucide-react';

export default function CPUPage() {
    const [cpuData, setCpuData] = useState([
        { name: 'P1', start: 0, duration: 4, color: '#60a5fa' },
        { name: 'P2', start: 4, duration: 2, color: '#a78bfa' },
        { name: 'P3', start: 6, duration: 3, color: '#f472b6' },
    ]);

    return (
        <div className="p-8 max-w-6xl mx-auto min-h-screen">
            <header className="mb-12">
                <h1 className="text-4xl font-bold mb-2">CPU Scheduling</h1>
                <p className="text-slate-400">Manage process queues and visualize execution order.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            Process Control
                        </h3>
                        <div className="space-y-4">
                            <button className="w-full py-3 bg-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
                                <Play size={18} /> Start Simulation
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="py-2 bg-slate-800 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
                                    <Pause size={16} /> Pause
                                </button>
                                <button className="py-2 bg-slate-800 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
                                    <RotateCcw size={16} /> Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">Next Processes</h3>
                            <Plus size={18} className="text-slate-500 cursor-pointer" />
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                                    <span className="text-sm font-mono text-slate-400">PID: 00{i}</span>
                                    <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded">Burst: {4 + i}ms</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Visualizer */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 min-h-[400px]">
                        <h3 className="text-xl font-bold mb-8">Real-time Visualization</h3>
                        <GanttChart data={cpuData} />

                        <div className="mt-12">
                            <h4 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Wait Times</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                    <div className="text-2xl font-bold text-blue-400">2.4ms</div>
                                    <div className="text-[10px] text-slate-500 uppercase">Avg Wait</div>
                                </div>
                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                    <div className="text-2xl font-bold text-purple-400">4.1ms</div>
                                    <div className="text-[10px] text-slate-500 uppercase">Avg Turnaround</div>
                                </div>
                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                    <div className="text-2xl font-bold text-emerald-400">89%</div>
                                    <div className="text-[10px] text-slate-500 uppercase">CPU Utilization</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
