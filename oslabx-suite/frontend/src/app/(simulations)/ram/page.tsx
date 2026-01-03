'use client';

import React from 'react';
import MemoryMap from '@/components/simulations/ram/MemoryMap';

export default function RAMPage() {
    const memoryBlocks: any[] = [
        { id: '1', size: 10, type: 'system', label: 'Kernel' },
        { id: '2', size: 15, type: 'process', label: 'Chrome.exe' },
        { id: '3', size: 20, type: 'free', label: 'Free' },
        { id: '4', size: 25, type: 'process', label: 'IDE' },
        { id: '5', size: 30, type: 'free', label: 'Free' },
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto min-h-screen">
            <header className="mb-12">
                <h1 className="text-4xl font-bold mb-2">Memory Management</h1>
                <p className="text-slate-400">Visualize physical and virtual memory allocation.</p>
            </header>

            <div className="space-y-8">
                <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800">
                    <MemoryMap blocks={memoryBlocks} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800">
                        <h3 className="text-xl font-bold mb-6">Page Table</h3>
                        <div className="overflow-hidden rounded-xl border border-slate-800">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-950 text-slate-500 uppercase text-[10px]">
                                    <tr>
                                        <th className="px-4 py-3">Page #</th>
                                        <th className="px-4 py-3">Frame #</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {[0, 1, 2, 3].map(i => (
                                        <tr key={i} className="bg-slate-900/20">
                                            <td className="px-4 py-3 font-mono">{i}</td>
                                            <td className="px-4 py-3 font-mono">{i * 2 + 10}</td>
                                            <td className="px-4 py-3 text-emerald-500">Present</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800">
                        <h3 className="text-xl font-bold mb-6">Swapping Statistics</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="text-xs text-slate-500 uppercase">Page Fault Rate</div>
                                <div className="text-xl font-bold">1.2%</div>
                            </div>
                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                <div className="w-[15%] h-full bg-blue-500" />
                            </div>
                            <div className="flex justify-between items-end mt-6">
                                <div className="text-xs text-slate-500 uppercase">Disk I/O Latency</div>
                                <div className="text-xl font-bold text-red-400">12ms</div>
                            </div>
                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                <div className="w-[65%] h-full bg-red-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
