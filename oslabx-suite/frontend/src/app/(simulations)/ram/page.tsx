'use client';

import React, { useState } from 'react';
import MemoryMap from '@/components/simulations/ram/MemoryMap';
import { useWasmModule } from '@/hooks/useWasmModule';
import { MemoryFitModule, PageReplacementModule, AllocationResult, MemoryBlock, ProcessRequest, PageStep } from '@/types/wasm';
import { Plus, Play, RotateCcw, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RAMPage() {
    const [activeTab, setActiveTab] = useState<'fit' | 'paging' | 'segmentation' | 'thrashing'>('fit');

    // Fit State
    const [fitAlgo, setFitAlgo] = useState<'first' | 'best' | 'worst'>('first');
    const [blocks, setBlocks] = useState<MemoryBlock[]>([
        { id: 1, size: 100, allocated: false, process_id: -1 },
        { id: 2, size: 500, allocated: false, process_id: -1 },
        { id: 3, size: 200, allocated: false, process_id: -1 },
        { id: 4, size: 300, allocated: false, process_id: -1 },
        { id: 5, size: 600, allocated: false, process_id: -1 },
    ]);
    const [requests, setRequests] = useState<ProcessRequest[]>([
        { id: 1, size: 212, allocated: false, block_id: -1 },
        { id: 2, size: 417, allocated: false, block_id: -1 },
        { id: 3, size: 112, allocated: false, block_id: -1 },
        { id: 4, size: 426, allocated: false, block_id: -1 },
    ]);

    // Page State
    const [pageAlgo, setPageAlgo] = useState<'fifo' | 'lru' | 'optimal' | 'lfu' | 'mfu'>('fifo');
    const [pageString, setPageString] = useState('1,3,0,3,5,6,3');
    const [framesCapacity, setFramesCapacity] = useState(3);
    const [pageSteps, setPageSteps] = useState<PageStep[]>([]);
    const [pageFaults, setPageFaults] = useState(0);

    // Segmentation State
    const [segments, setSegments] = useState<any[]>([
        { name: 'Code', size: 124 },
        { name: 'Data', size: 50 },
        { name: 'Stack', size: 30 },
    ]);
    const [segBlocks, setSegBlocks] = useState<any[]>([
        { id: 1, size: 200, allocated: false, label: 'Free' },
        { id: 2, size: 100, allocated: false, label: 'Free' },
    ]);

    // Thrashing State
    const [thrashingData, setThrashingData] = useState<any[]>([]);

    // Modules
    const fitModule = useWasmModule<MemoryFitModule>('/wasm/memory_fit.js', 'createMemoryFitModule');
    const pageModule = useWasmModule<PageReplacementModule>('/wasm/page_replacement.js', 'createPageReplacementModule');

    // Run Fit Simulation
    const runFit = async () => {
        if (!fitModule.module) return;
        try {
            const { MemoryManager, 'vector<MemoryBlock>': VecBlock, 'vector<ProcessRequest>': VecReq } = fitModule.module;
            const manager = new MemoryManager();
            const vecBlocks = new VecBlock();
            const vecReqs = new VecReq();

            // Populate vectors (fresh copies)
            blocks.forEach(b => {
                // Reset allocation for re-run logic if needed, but here we take current state or reset?
                // Let's assume we want to run on current "Setup". 
                // Usually for First Fit we run on clean blocks or sequential.
                // Let's reset "allocated" status for simulation run to verify algorithm.
                vecBlocks.push_back({ ...b, allocated: false, process_id: -1 });
            });
            requests.forEach(r => vecReqs.push_back({ ...r, allocated: false, block_id: -1 }));

            let result: AllocationResult;
            if (fitAlgo === 'first') result = manager.first_fit(vecBlocks, vecReqs);
            else if (fitAlgo === 'best') result = manager.best_fit(vecBlocks, vecReqs);
            else result = manager.worst_fit(vecBlocks, vecReqs);

            const newBlocks: MemoryBlock[] = [];
            const newRequests: ProcessRequest[] = [];

            const resultBlocks = result.blocks;
            const resultRequests = result.processes;

            for (let i = 0; i < resultBlocks.size(); i++) newBlocks.push(resultBlocks.get(i));
            for (let i = 0; i < resultRequests.size(); i++) newRequests.push(resultRequests.get(i));

            setBlocks(newBlocks);
            setRequests(newRequests); // Show which requests were satisfied

            manager.delete();
            vecBlocks.delete();
            vecReqs.delete();
        } catch (e) { console.error(e); }
    };

    // Run Page Replacement
    const runPage = async () => {
        if (!pageModule.module) return;
        try {
            const { PageReplacement, 'vector<int>': VecInt } = pageModule.module;
            const pr = new PageReplacement();
            const pagesVec = new VecInt();

            const pages = pageString.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
            pages.forEach(p => pagesVec.push_back(p));

            let resultVec;
            if (pageAlgo === 'fifo') resultVec = pr.fifo(pagesVec, framesCapacity);
            else if (pageAlgo === 'lru') resultVec = pr.lru(pagesVec, framesCapacity);
            else if (pageAlgo === 'lfu') resultVec = pr.lfu(pagesVec, framesCapacity);
            else if (pageAlgo === 'mfu') resultVec = pr.mfu(pagesVec, framesCapacity);
            else resultVec = pr.optimal(pagesVec, framesCapacity);

            const steps: PageStep[] = [];
            let faults = 0;
            for (let i = 0; i < resultVec.size(); i++) {
                const s = resultVec.get(i);

                // Copy frames vector
                const frames: number[] = [];
                const wasmFrames = s.frames;
                for (let k = 0; k < wasmFrames.size(); k++) frames.push(wasmFrames.get(k));

                steps.push({
                    page: s.page,
                    step: s.step,
                    frames: frames,
                    fault: s.fault
                });
                if (s.fault) faults++;
            }

            setPageSteps(steps);
            setPageFaults(faults);

            pr.delete();
            pagesVec.delete();
        } catch (e) { console.error(e); }
    };

    // Run Thrashing Simulation
    const runThrashing = () => {
        const data = [];
        for (let n = 1; n <= 20; n++) {
            // Simulated CPU Utilization: increases with n, then drops sharply due to thrashing
            let util;
            if (n <= 12) {
                util = 10 * Math.log2(n + 1) + (n * 2);
            } else {
                util = (12 * 8) / (n - 10) + 10;
            }
            data.push({ degree: n, cpu: Math.min(util, 95) });
        }
        setThrashingData(data);
    };

    // UI Helper for Memory Blocks
    const mappedBlocks = blocks.map(b => ({
        id: b.id.toString(),
        size: b.size,
        type: (b.allocated ? 'process' : 'free') as 'process' | 'free',
        label: b.allocated ? `Process ${b.process_id}` : `Free (${b.size}KB)`
    }));

    return (
        <div className="p-8 max-w-6xl mx-auto min-h-screen">
            <header className="mb-12">
                <h1 className="text-4xl font-bold mb-2">Memory Management</h1>
                <p className="text-slate-400">Advanced Memory Allocation & Synchronization Simulations</p>
            </header>

            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                <button
                    onClick={() => setActiveTab('fit')}
                    className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'fit' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800/50 text-slate-400'}`}
                >
                    Allocation (Fit)
                </button>
                <button
                    onClick={() => setActiveTab('paging')}
                    className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'paging' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800/50 text-slate-400'}`}
                >
                    Page Replacement
                </button>
                <button
                    onClick={() => setActiveTab('segmentation')}
                    className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'segmentation' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800/50 text-slate-400'}`}
                >
                    Segmentation
                </button>
                <button
                    onClick={() => setActiveTab('thrashing')}
                    className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'thrashing' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800/50 text-slate-400'}`}
                >
                    Thrashing
                </button>
            </div>

            {activeTab === 'fit' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <h3 className="font-bold mb-4">Configuration</h3>
                            <label className="block text-sm text-slate-400 mb-2">Algorithm</label>
                            <select className="w-full bg-slate-950 p-2 rounded mb-4 border border-slate-700" value={fitAlgo} onChange={(e: any) => setFitAlgo(e.target.value)}>
                                <option value="first">First Fit</option>
                                <option value="best">Best Fit</option>
                                <option value="worst">Worst Fit</option>
                            </select>

                            <div className="mb-4">
                                <label className="block text-xs uppercase text-slate-500 mb-2">Memory Blocks (Size)</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="number"
                                        placeholder="Size"
                                        className="w-full bg-slate-950 p-2 rounded border border-slate-800"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = parseInt(e.currentTarget.value);
                                                if (!isNaN(val) && val > 0) {
                                                    setBlocks([...blocks, { id: blocks.length + 1, size: val, allocated: false, process_id: -1 }]);
                                                    e.currentTarget.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => setBlocks([])}
                                        className="px-3 py-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20"
                                        title="Clear All Blocks"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                </div>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {blocks.map(b => (
                                        <div key={b.id} className="flex justify-between text-xs bg-slate-950 p-2 rounded items-center gap-2">
                                            <span className="text-slate-500 min-w-[50px]">Block {b.id}</span>
                                            <input
                                                type="number"
                                                className="bg-transparent border-none outline-none text-slate-200 w-full text-right focus:ring-1 focus:ring-blue-500 rounded px-1"
                                                value={b.size}
                                                onChange={(e) => {
                                                    const newSize = parseInt(e.target.value) || 0;
                                                    setBlocks(blocks.map(x => x.id === b.id ? { ...x, size: newSize } : x));
                                                }}
                                            />
                                            <span className="text-slate-600">KB</span>
                                            <button
                                                onClick={() => setBlocks(blocks.filter(x => x.id !== b.id))}
                                                className="text-red-400 hover:text-red-300 ml-2"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-xs uppercase text-slate-500 mb-2">Process Requests (Size)</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="number"
                                        placeholder="Size"
                                        className="w-full bg-slate-950 p-2 rounded border border-slate-800"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = parseInt(e.currentTarget.value);
                                                if (!isNaN(val) && val > 0) {
                                                    setRequests([...requests, { id: requests.length + 1, size: val, allocated: false, block_id: -1 }]);
                                                    e.currentTarget.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => setRequests([])}
                                        className="px-3 py-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20"
                                        title="Clear All Requests"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                </div>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {requests.map(r => (
                                        <div key={r.id} className="flex justify-between text-xs bg-slate-950 p-2 rounded items-center gap-2">
                                            <span className="text-slate-500 min-w-[50px]">P{r.id}</span>
                                            <input
                                                type="number"
                                                className="bg-transparent border-none outline-none text-slate-200 w-full text-right focus:ring-1 focus:ring-blue-500 rounded px-1"
                                                value={r.size}
                                                onChange={(e) => {
                                                    const newSize = parseInt(e.target.value) || 0;
                                                    setRequests(requests.map(x => x.id === r.id ? { ...x, size: newSize } : x));
                                                }}
                                            />
                                            <span className="text-slate-600">KB</span>
                                            <button
                                                onClick={() => setRequests(requests.filter(x => x.id !== r.id))}
                                                className="text-red-400 hover:text-red-300 ml-2"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button onClick={runFit} className="w-full py-2 bg-blue-600 rounded font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
                                <Play size={16} /> Allocate Memory
                            </button>
                            <button onClick={() => {
                                setBlocks(blocks.map(b => ({ ...b, allocated: false, process_id: -1 })));
                                setRequests(requests.map(r => ({ ...r, allocated: false, block_id: -1 })));
                            }} className="w-full py-2 bg-slate-800 rounded font-bold mt-2 hover:bg-slate-700 transition-colors">
                                Reset Allocation
                            </button>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <h3 className="font-bold mb-4">Requests Status</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {requests.length === 0 && <p className="text-slate-500 text-sm">No requests added.</p>}
                                {requests.map(r => (
                                    <div key={r.id} className="flex justify-between text-sm p-2 bg-slate-950 rounded">
                                        <span>P{r.id} ({r.size}KB)</span>
                                        <span className={r.allocated ? "text-emerald-400" : "text-yellow-500"}>
                                            {r.allocated ? `Block ${r.block_id}` : "Pending"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 h-full">
                            <h3 className="font-bold mb-6">Memory Map</h3>
                            <MemoryMap blocks={mappedBlocks} />
                        </div>
                    </div>
                </div>
            ) : activeTab === 'paging' ? (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
                        <div>
                            <label className="block text-xs uppercase text-slate-500 mb-1">Algorithm</label>
                            <select className="w-full bg-slate-950 p-2 rounded" value={pageAlgo} onChange={(e: any) => setPageAlgo(e.target.value)}>
                                <option value="fifo">FIFO</option>
                                <option value="lru">LRU (Least Recently Used)</option>
                                <option value="optimal">Optimal</option>
                                <option value="lfu">LFU (Least Frequently Used)</option>
                                <option value="mfu">MFU (Most Frequently Used)</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs uppercase text-slate-500 mb-1">Reference String (comma values)</label>
                            <input className="w-full bg-slate-950 p-2 rounded" value={pageString} onChange={(e) => setPageString(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-slate-500 mb-1">Frames</label>
                            <input className="w-full bg-slate-950 p-2 rounded" type="number" value={framesCapacity} onChange={(e) => setFramesCapacity(Number(e.target.value))} />
                        </div>
                        <div className="md:col-span-4">
                            <button onClick={runPage} className="w-full py-3 bg-blue-600 rounded-lg font-bold">Simulate Paging</button>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl">
                        <div className="flex justify-between mb-6">
                            <h3 className="font-bold text-xl">Simulation Steps</h3>
                            <div className="text-sm">FAULTS: <span className="text-red-400 font-bold ml-2">{pageFaults}</span></div>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4">
                            {pageSteps.map((step, idx) => (
                                <div key={idx} className={`min-w-[100px] p-4 rounded-xl border ${step.fault ? 'border-red-500/30 bg-red-500/5' : 'border-emerald-500/30 bg-emerald-500/5'} flex flex-col items-center`}>
                                    <div className="text-xs text-slate-500 mb-2">Step {idx + 1}</div>
                                    <div className="font-bold text-2xl mb-4">{step.page}</div>
                                    <div className="space-y-1 w-full">
                                        {step.frames.map((f: number, fi: number) => (
                                            <div key={fi} className="w-full bg-slate-950 py-1 text-center text-xs rounded border border-slate-800">
                                                {f}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2 text-[10px] uppercase font-bold">
                                        {step.fault ? <span className="text-red-400">Fault</span> : <span className="text-emerald-400">Hit</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : activeTab === 'segmentation' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <h3 className="font-bold mb-4">Process Segments</h3>
                            <div className="space-y-3">
                                {segments.map((seg, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input className="w-full bg-slate-950 p-2 rounded text-xs" value={seg.name} readOnly />
                                        <input className="w-24 bg-slate-950 p-2 rounded text-xs" value={seg.size} readOnly />
                                    </div>
                                ))}
                                <div className="text-[10px] text-slate-500 italic mt-2">
                                    Segmentation allows processes to be divided into logical units.
                                </div>
                            </div>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <h3 className="font-bold mb-4">Segment Table</h3>
                            <table className="w-full text-xs text-left text-slate-400">
                                <thead>
                                    <tr className="border-b border-slate-800">
                                        <th className="pb-2">Segment</th>
                                        <th className="pb-2">Base</th>
                                        <th className="pb-2">Limit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {segments.map((seg, i) => (
                                        <tr key={i} className="border-b border-slate-900">
                                            <td className="py-2 text-blue-400">{seg.name}</td>
                                            <td className="py-2 font-mono">{i * 1000}</td>
                                            <td className="py-2 font-mono">{seg.size}K</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 h-full">
                            <h3 className="font-bold mb-6">Logical-to-Physical Visualization</h3>
                            <div className="space-y-8">
                                {segments.map((seg, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-32 py-4 bg-blue-500/20 border border-blue-500/50 rounded-lg text-center text-xs font-bold">
                                            {seg.name} ({seg.size}K)
                                        </div>
                                        <div className="flex-1 h-0.5 bg-slate-800 relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 px-2 bg-slate-900 text-[10px] text-slate-500">Mapping...</div>
                                        </div>
                                        <div className="w-48 py-4 bg-slate-950 border border-slate-800 rounded-lg text-center text-[10px]">
                                            Physical Address: <span className="text-emerald-400">0x{(i * 1000).toString(16).toUpperCase()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="font-bold text-xl">Thrashing Simulation</h3>
                                <p className="text-sm text-slate-500 mt-1">CPU Utilization vs. Degree of Multiprogramming</p>
                            </div>
                            <button onClick={runThrashing} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-full font-bold flex items-center gap-2">
                                <Activity size={18} /> Simulate Load
                            </button>
                        </div>

                        {thrashingData.length > 0 ? (
                            <div style={{ width: '100%', height: '400px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={thrashingData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="degree" label={{ value: 'Degree of Multiprogramming', position: 'insideBottom', offset: -5, fill: '#64748b' }} tick={{ fill: '#64748b' }} />
                                        <YAxis label={{ value: 'CPU Utilization (%)', angle: -90, position: 'insideLeft', fill: '#64748b' }} tick={{ fill: '#64748b' }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                                        <Line type="monotone" dataKey="cpu" stroke="#a78bfa" strokeWidth={3} dot={{ fill: '#a78bfa' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-600">
                                <Activity size={48} className="mb-4 opacity-20" />
                                Run simulation to see the thrashing point
                            </div>
                        )}

                        <div className="mt-8 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                            <h4 className="text-sm font-bold text-red-400 mb-2 uppercase">Analysis</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                As you increase the degree of multiprogramming, CPU utilization increases until the system starts spending more time swapping pages than executing instructions. This sharp drop is known as **Thrashing**.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
