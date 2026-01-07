'use client';

import React, { useState } from 'react';
import { useWasmModule } from '@/hooks/useWasmModule';
import { BankerModule, BankerResult } from '@/types/wasm';
import { Share2, Play, AlertTriangle, CheckCircle } from 'lucide-react';
import ResourceGraph from '@/components/simulations/deadlock/ResourceGraph';

export default function DeadlockPage() {
    const [numProcesses, setNumProcesses] = useState(5);
    const [numResources, setNumResources] = useState(3);

    // Matrices (Flattened or arrays of arrays) applied to inputs
    // For simplicity, manage as separate matrix states
    const [allocation, setAllocation] = useState<number[][]>([
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2]
    ]);
    const [max, setMax] = useState<number[][]>([
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3]
    ]);
    const [available, setAvailable] = useState<number[]>([3, 3, 2]);
    const [result, setResult] = useState<BankerResult | null>(null);

    const bankerModule = useWasmModule<BankerModule>('/wasm/banker.js', 'createBankerModule');

    const updateAllocation = (p: number, r: number, val: number) => {
        const newMat = [...allocation];
        newMat[p][r] = val;
        setAllocation(newMat);
    };

    const updateMax = (p: number, r: number, val: number) => {
        const newMat = [...max];
        newMat[p][r] = val;
        setMax(newMat);
    };

    const solve = () => {
        if (!bankerModule.module) return;
        try {
            const { Banker, 'vector<int>': VecInt } = bankerModule.module;
            const b = new Banker();

            // Convert to flat vectors expected by C++ binding
            const allocVec = new VecInt();
            const maxVec = new VecInt();
            const availVec = new VecInt();

            allocation.flat().forEach(v => allocVec.push_back(v));
            max.flat().forEach(v => maxVec.push_back(v));
            available.forEach(v => availVec.push_back(v));

            const res = b.solve(numProcesses, numResources, allocVec, maxVec, availVec);

            const safeSeq: number[] = [];
            if (res.is_safe) {
                const seq = res.safe_sequence;
                for (let i = 0; i < seq.size(); i++) safeSeq.push(seq.get(i));
            }

            setResult({
                is_safe: res.is_safe,
                safe_sequence: safeSeq
            });

            b.delete();
            allocVec.delete();
            maxVec.delete();
            availVec.delete();

        } catch (e) { console.error(e); }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto min-h-screen">
            <header className="mb-12 flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-2xl">
                    <Share2 className="text-red-500 w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold mb-2">Deadlock Avoidance</h1>
                    <p className="text-slate-400">Banker's Algorithm analysis.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
                    <h3 className="font-bold mb-4">Resources Available</h3>
                    <div className="flex gap-4">
                        {available.map((val, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <label className="text-xs text-slate-500 mb-1">R{i}</label>
                                <input
                                    type="number"
                                    className="w-16 bg-slate-950 p-2 text-center rounded border border-slate-800"
                                    value={val}
                                    onChange={(e) => {
                                        const newAvail = [...available];
                                        newAvail[i] = Number(e.target.value);
                                        setAvailable(newAvail);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-center">
                    <button onClick={solve} className="px-8 py-4 bg-red-600 hover:bg-red-500 rounded-xl font-bold flex items-center gap-2 transition-colors">
                        <Play size={20} /> Analyze Safety
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl">
                    <h3 className="font-bold mb-6 text-blue-400">Allocation Matrix</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="p-2 text-left text-xs text-slate-500">Process</th>
                                    {Array.from({ length: numResources }).map((_, i) => <th key={i} className="p-2 text-center text-xs text-slate-500">R{i}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {allocation.map((row, pIndex) => (
                                    <tr key={pIndex}>
                                        <td className="p-2 font-mono text-sm text-slate-400">P{pIndex}</td>
                                        {row.map((val, rIndex) => (
                                            <td key={rIndex} className="p-1">
                                                <input
                                                    type="number"
                                                    className="w-full bg-slate-950 p-2 text-center rounded text-sm"
                                                    value={val}
                                                    onChange={(e) => updateAllocation(pIndex, rIndex, Number(e.target.value))}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl">
                    <h3 className="font-bold mb-6 text-purple-400">Max Matrix</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="p-2 text-left text-xs text-slate-500">Process</th>
                                    {Array.from({ length: numResources }).map((_, i) => <th key={i} className="p-2 text-center text-xs text-slate-500">R{i}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {max.map((row, pIndex) => (
                                    <tr key={pIndex}>
                                        <td className="p-2 font-mono text-sm text-slate-400">P{pIndex}</td>
                                        {row.map((val, rIndex) => (
                                            <td key={rIndex} className="p-1">
                                                <input
                                                    type="number"
                                                    className="w-full bg-slate-950 p-2 text-center rounded text-sm"
                                                    value={val}
                                                    onChange={(e) => updateMax(pIndex, rIndex, Number(e.target.value))}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {result && (
                <div className="space-y-8">
                    <div className={`p-8 rounded-3xl border ${result.is_safe ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'} flex flex-col items-center text-center`}>
                        {result.is_safe ? (
                            <>
                                <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
                                <h2 className="text-3xl font-bold text-emerald-400 mb-2">System is Safe</h2>
                                <p className="text-slate-400 mb-6">A safe sequence was found effectively.</p>
                                <div className="flex gap-4 flex-wrap justify-center">
                                    {result.safe_sequence?.map((pid: any, i: number) => (
                                        <React.Fragment key={i}>
                                            <div className="px-4 py-2 bg-emerald-900/50 text-emerald-200 rounded-lg font-mono font-bold">P{pid}</div>
                                            {i < result.safe_sequence.length - 1 && <span className="text-emerald-600 self-center">→</span>}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
                                <h2 className="text-3xl font-bold text-red-400 mb-2">Deadlock Detected</h2>
                                <p className="text-slate-400">The system is in an unsafe state. No safe sequence exists.</p>
                            </>
                        )}
                    </div>

                    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl">
                        <h3 className="font-bold mb-6 text-slate-300">Resource Allocation Graph (RAG)</h3>
                        <ResourceGraph
                            processes={numProcesses}
                            resources={numResources}
                            allocation={allocation}
                            request={max.map((row, i) => row.map((m, j) => Math.max(0, m - allocation[i][j])))}
                            available={available}
                        />
                        <div className="mt-4 flex gap-6 justify-center text-xs text-slate-500">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Process</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded-sm"></div> Resource</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-emerald-500"></div> Allocated</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-amber-500"></div> Requested</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
