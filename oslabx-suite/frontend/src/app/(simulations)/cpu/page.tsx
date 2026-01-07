'use client';

import React, { useState, useEffect } from 'react';
import GanttChart from '@/components/simulations/cpu/GanttChart';
import { Play, RotateCcw, Plus, Trash2, Cpu } from 'lucide-react';
import { useWasmModule } from '@/hooks/useWasmModule';
import { SchedulerModule, Process } from '@/types/wasm';

type AlgoType = 'fcfs' | 'sjf' | 'rr' | 'priority';

const INITIAL_PROCESSES: Process[] = [
    { id: 1, arrival_time: 0, burst_time: 4, priority: 1, remaining_time: 4 },
    { id: 2, arrival_time: 1, burst_time: 2, priority: 2, remaining_time: 2 },
    { id: 3, arrival_time: 2, burst_time: 3, priority: 1, remaining_time: 3 },
];

export default function CPUPage() {
    const [algorithm, setAlgorithm] = useState<AlgoType>('fcfs');
    const [processes, setProcesses] = useState<Process[]>(INITIAL_PROCESSES);
    const [quantum, setQuantum] = useState(2);
    const [simulationResults, setSimulationResults] = useState<any[]>([]);
    const [rawResults, setRawResults] = useState<Process[]>([]);
    const [stats, setStats] = useState({ avgWait: 0, avgTurnaround: 0, utilization: 0 });
    const [nextId, setNextId] = useState(4);
    const [newProcess, setNewProcess] = useState({ arrival: 0, burst: 1, priority: 1 });

    // Load ALL modules (in a real app, load on demand or parallel)
    const fcfsModule = useWasmModule<SchedulerModule>('/wasm/fcfs.js', 'createFCFSModule');
    const sjfModule = useWasmModule<SchedulerModule>('/wasm/sjf.js', 'createSJFModule');
    const rrModule = useWasmModule<SchedulerModule>('/wasm/round_robin.js', 'createRRModule');
    const priorityModule = useWasmModule<SchedulerModule>('/wasm/priority.js', 'createPriorityModule');

    const getCurrentModule = () => {
        switch (algorithm) {
            case 'fcfs': return fcfsModule;
            case 'sjf': return sjfModule;
            case 'rr': return rrModule;
            case 'priority': return priorityModule;
        }
    };

    const currentModule = getCurrentModule();

    const handleAddProcess = () => {
        setProcesses([...processes, {
            id: nextId,
            arrival_time: Number(newProcess.arrival),
            burst_time: Number(newProcess.burst),
            priority: Number(newProcess.priority),
            remaining_time: Number(newProcess.burst)
        }]);
        setNextId(nextId + 1);
    };

    const handleRemoveProcess = (id: number) => {
        setProcesses(processes.filter(p => p.id !== id));
    };

    const runSimulation = () => {
        if (!currentModule.module) {
            alert("Module not loaded yet!");
            return;
        }

        try {
            const { Scheduler, Process: WasmProcess, 'vector<Process>': ProcessVector } = currentModule.module;

            const scheduler = new Scheduler();
            const vec = new ProcessVector();

            // Populate vector
            processes.forEach(p => {
                const wp = new WasmProcess();
                wp.id = p.id;
                wp.burst_time = p.burst_time;
                wp.arrival_time = p.arrival_time;
                wp.priority = p.priority || 0;
                wp.remaining_time = p.burst_time;
                wp.completion_time = 0;
                wp.waiting_time = 0;
                wp.turn_around_time = 0;
                vec.push_back(wp);
            });

            // Execute
            let resultVec;
            if (algorithm === 'rr') {
                resultVec = scheduler.round_robin(vec, quantum);
            } else if (algorithm === 'sjf') {
                resultVec = scheduler.sjf(vec);
            } else if (algorithm === 'priority') {
                resultVec = scheduler.priority_scheduling(vec);
            } else {
                resultVec = scheduler.fcfs(vec);
            }

            // Extract results
            const results: Process[] = [];
            let totalWait = 0;
            let totalTurnaround = 0;
            let maxCompletion = 0;

            for (let i = 0; i < resultVec.size(); i++) {
                const p = resultVec.get(i);
                // We need to clone the properties because the Wasm object might be deleted or memory changes
                results.push({
                    id: p.id,
                    burst_time: p.burst_time,
                    arrival_time: p.arrival_time,
                    priority: p.priority,
                    completion_time: p.completion_time,
                    waiting_time: p.waiting_time,
                    turn_around_time: p.turn_around_time
                });

                totalWait += p.waiting_time || 0;
                totalTurnaround += p.turn_around_time || 0;
                if ((p.completion_time || 0) > maxCompletion) maxCompletion = p.completion_time || 0;
            }

            // Calculate Utilization (Total Burst / Max Completion)
            const totalBurst = processes.reduce((acc, curr) => acc + curr.burst_time, 0);
            const util = maxCompletion > 0 ? (totalBurst / maxCompletion) * 100 : 0;

            setStats({
                avgWait: totalWait / results.length,
                avgTurnaround: totalTurnaround / results.length,
                utilization: util
            });

            // Map results to GanttChart format
            // Note: WASM returns Process with completion times.
            // Ideally Gantt needs start/end segments. 
            // For FCFS/SJF/Priority (Non-preemptive), Start = Completion - Burst.
            // For RR, the C++ code returns FINAL completion. It doesn't trace execution steps.
            // To visualize Preemptive properly in Gantt, C++ code needs to return a schedule log.
            // Current C++ implementation only returns final Process struct. 
            // Visualization will be simplified: Show final blocks sorted by completion time.

            const ganttData = results
                .sort((a, b) => (a.completion_time || 0) - (b.completion_time || 0))
                .map((p, idx, arr) => {
                    const end = p.completion_time || 0;
                    const start = end - p.burst_time;
                    return {
                        name: `P${p.id}`,
                        start: start,
                        duration: p.burst_time,
                        color: ['#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fbbf24'][p.id % 5]
                    };
                });

            setSimulationResults(ganttData);
            setRawResults(results);

            // Cleanup
            vec.delete();
            scheduler.delete();

        } catch (e) {
            console.error("Simulation failed:", e);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto min-h-screen">
            <header className="mb-12 flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                    <Cpu className="text-blue-500 w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold mb-2">CPU Scheduling</h1>
                    <p className="text-slate-400">High-performance algorithms compiled from C++ to WASM.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Algorithm Selection */}
                    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                        <label className="block text-sm font-bold text-slate-400 mb-3">Algorithm</label>
                        <select
                            value={algorithm}
                            onChange={(e) => setAlgorithm(e.target.value as AlgoType)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="fcfs">First Come First Serve (FCFS)</option>
                            <option value="sjf">Shortest Job First (SJF)</option>
                            <option value="priority">Priority Scheduling</option>
                            <option value="rr">Round Robin</option>
                        </select>

                        {algorithm === 'rr' && (
                            <div className="mt-4">
                                <label className="block text-sm font-bold text-slate-400 mb-2">Time Quantum</label>
                                <input
                                    type="number"
                                    value={quantum}
                                    onChange={(e) => setQuantum(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm"
                                />
                            </div>
                        )}
                    </div>

                    {/* Process Input */}
                    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                        <h3 className="font-bold mb-4">Add Process</h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500">Arrival</label>
                                    <input
                                        type="number"
                                        value={newProcess.arrival}
                                        onChange={e => setNewProcess({ ...newProcess, arrival: Number(e.target.value) })}
                                        className="w-full bg-slate-950 rounded p-2 text-sm border border-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500">Burst</label>
                                    <input
                                        type="number"
                                        value={newProcess.burst}
                                        onChange={e => setNewProcess({ ...newProcess, burst: Number(e.target.value) })}
                                        className="w-full bg-slate-950 rounded p-2 text-sm border border-slate-800"
                                    />
                                </div>
                            </div>
                            {algorithm === 'priority' && (
                                <div>
                                    <label className="text-xs text-slate-500">Priority (Lower = Higher)</label>
                                    <input
                                        type="number"
                                        value={newProcess.priority}
                                        onChange={e => setNewProcess({ ...newProcess, priority: Number(e.target.value) })}
                                        className="w-full bg-slate-950 rounded p-2 text-sm border border-slate-800"
                                    />
                                </div>
                            )}
                            <button
                                onClick={handleAddProcess}
                                className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                            >
                                <Plus size={14} /> Add to Queue
                            </button>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                        <h3 className="font-bold mb-4">Process Queue ({processes.length})</h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {processes.map(p => (
                                <div key={p.id} className="p-3 bg-slate-950 rounded border border-slate-800 flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: ['#60a5fa', '#a78bfa', '#f472b6', '#34d399'][p.id % 4] }} />
                                        <div className="text-xs">
                                            <div className="font-mono text-slate-300">ID: {p.id}</div>
                                            <div className="text-slate-500">AT: {p.arrival_time} | BT: {p.burst_time} {algorithm === 'priority' ? `| P: ${p.priority}` : ''}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveProcess(p.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={runSimulation}
                        disabled={currentModule.isLoading || processes.length === 0}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${currentModule.isLoading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                            }`}
                    >
                        {currentModule.isLoading ? 'Loading WASM...' : <><Play size={18} /> Run Simulation</>}
                    </button>
                </div>

                {/* Visualizer */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 min-h-[400px]">
                        <h3 className="text-xl font-bold mb-8">Gantt Chart Visualization</h3>

                        {simulationResults.length > 0 ? (
                            <>
                                <GanttChart data={simulationResults} />

                                <div className="mt-12 overflow-x-auto">
                                    <h4 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Process Details</h4>
                                    <table className="w-full text-sm text-left text-slate-400">
                                        <thead className="text-xs uppercase bg-slate-950 text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3 rounded-l-lg">Process</th>
                                                <th className="px-4 py-3">Arrival</th>
                                                <th className="px-4 py-3">Burst</th>
                                                <th className="px-4 py-3">Completion</th>
                                                <th className="px-4 py-3">Turnaround</th>
                                                <th className="px-4 py-3 rounded-r-lg">Waiting</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rawResults.sort((a, b) => (a.completion_time || 0) - (b.completion_time || 0)).map((p) => (
                                                <tr key={p.id} className="border-b border-slate-800 hover:bg-slate-800/20">
                                                    <td className="px-4 py-3 font-medium text-slate-200">P{p.id}</td>
                                                    <td className="px-4 py-3">{p.arrival_time}</td>
                                                    <td className="px-4 py-3">{p.burst_time}</td>
                                                    <td className="px-4 py-3 text-emerald-400">{p.completion_time}</td>
                                                    <td className="px-4 py-3 text-purple-400">{p.turn_around_time}</td>
                                                    <td className="px-4 py-3 text-blue-400">{p.waiting_time}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                                Run simulation to view results
                            </div>
                        )}

                        <div className="mt-12">
                            <h4 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Metrics</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                    <div className="text-2xl font-bold text-blue-400">{stats.avgWait.toFixed(2)}ms</div>
                                    <div className="text-[10px] text-slate-500 uppercase">Avg Wait Time</div>
                                </div>
                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                    <div className="text-2xl font-bold text-purple-400">{stats.avgTurnaround.toFixed(2)}ms</div>
                                    <div className="text-[10px] text-slate-500 uppercase">Avg Turnaround</div>
                                </div>
                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                    <div className="text-2xl font-bold text-emerald-400">{stats.utilization.toFixed(1)}%</div>
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
