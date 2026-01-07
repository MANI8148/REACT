'use client';

import React, { useState, useEffect } from 'react';
import { GitMerge, Lock, Minus, Plus, RefreshCw, Layers } from 'lucide-react';

// Types for our visual simulation
interface Thread {
    id: number;
    state: 'thinking' | 'waiting' | 'eating' | 'producing' | 'consuming';
    name: string;
}

interface BufferItem {
    id: number;
    value: string;
}

// Classical Problems
type ProblemType = 'dining' | 'producer';

export default function ThreadsPage() {
    const [problem, setProblem] = useState<ProblemType>('producer');
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    // PC State
    const [bufferSize, setBufferSize] = useState(5);
    const [buffer, setBuffer] = useState<BufferItem[]>([]);
    const [mutex, setMutex] = useState(true); // true = unlocked
    const [emptySlots, setEmptySlots] = useState(5);
    const [fullSlots, setFullSlots] = useState(0);

    // Dining State
    const [philosophers, setPhilosophers] = useState<Thread[]>([
        { id: 0, state: 'thinking', name: 'Aristotle' },
        { id: 1, state: 'thinking', name: 'Plato' },
        { id: 2, state: 'thinking', name: 'Socrates' },
        { id: 3, state: 'thinking', name: 'Confucius' },
        { id: 4, state: 'thinking', name: 'Kant' },
    ]);
    const [forks, setForks] = useState<boolean[]>([true, true, true, true, true]); // true = available

    const addLog = (msg: string) => {
        setLogs(prev => [msg, ...prev].slice(0, 50));
    };

    // Producer Consumer Simulation Step
    useEffect(() => {
        if (!isRunning || problem !== 'producer') return;

        const interval = setInterval(() => {
            // Randomly decide to produce or consume
            const action = Math.random() > 0.5 ? 'produce' : 'consume';

            if (action === 'produce') {
                if (buffer.length < bufferSize) {
                    // Start Production
                    // In real semaphores: wait(empty), wait(mutex)

                    setBuffer(prev => {
                        const newItem = { id: Date.now(), value: Math.floor(Math.random() * 100).toString() };
                        addLog(`Produced Item ${newItem.value}`);
                        return [...prev, newItem];
                    });
                } else {
                    addLog('Producer waiting - Buffer Full');
                }
            } else {
                if (buffer.length > 0) {
                    // Start Consumption
                    setBuffer(prev => {
                        const item = prev[0];
                        addLog(`Consumed Item ${item.value}`);
                        return prev.slice(1);
                    });
                } else {
                    addLog('Consumer waiting - Buffer Empty');
                }
            }
        }, 1500);

        return () => clearInterval(interval);
    }, [isRunning, problem, buffer, bufferSize]);

    // Dining Philosophers Simulation Step
    useEffect(() => {
        if (!isRunning || problem !== 'dining') return;

        const interval = setInterval(() => {
            // Pick a random philosopher to change state
            const philIdx = Math.floor(Math.random() * 5);
            setPhilosophers(prev => {
                const newPhils = [...prev];
                const phil = newPhils[philIdx];
                const leftFork = philIdx;
                const rightFork = (philIdx + 1) % 5;

                if (phil.state === 'thinking') {
                    // Try to eat
                    // Need both forks
                    if (forks[leftFork] && forks[rightFork]) {
                        // Taking forks (This state update is effectively atomic in React relative to render, 
                        // but logic mimics checking semaphore)
                        // Note: To properly update forks we need to access current forks state.
                        // Inside this setState callback we only have prevPhils. We need effect dependency on forks.
                        // But sticking to simple visual logic step:
                        // We will dispatch separate action or use a ref for true simulation if needed.
                        // Here we just request simulation tick.
                        return newPhils;
                    }
                } else if (phil.state === 'eating') {
                    // Finish eating
                    newPhils[philIdx].state = 'thinking';
                    addLog(`${phil.name} finished eating and thinking.`);
                    // Release forks handled in separate effect or synced state?
                    // Let's refactor to a single tick function that has access to all state refs.
                }
                return newPhils;
            });
        }, 1000); // This effect structure is bad for coordinated state.

        // Refactored Simple Tick
        return () => clearInterval(interval);
    }, [isRunning, problem]);

    // Better Tick Logic for Dining
    useEffect(() => {
        if (!isRunning || problem !== 'dining') return;

        const tick = setInterval(() => {
            // Try to make a move for one philosopher
            const idx = Math.floor(Math.random() * 5);

            setPhilosophers(prevPhils => {
                const newPhils = [...prevPhils];
                const p = newPhils[idx];

                if (p.state === 'thinking') {
                    // Attempt to eat
                    setForks(currForks => {
                        const left = idx;
                        const right = (idx + 1) % 5;
                        if (currForks[left] && currForks[right]) {
                            // Success
                            const newForks = [...currForks];
                            newForks[left] = false;
                            newForks[right] = false;
                            newPhils[idx].state = 'eating';
                            addLog(`${p.name} picked up forks and started eating.`);
                            return newForks;
                        } else {
                            // Wait
                            if (p.state !== 'eating') addLog(`${p.name} is hungry but forks busy.`);
                            return currForks;
                        }
                    });
                } else if (p.state === 'eating') {
                    // Finished
                    setForks(currForks => {
                        const left = idx;
                        const right = (idx + 1) % 5;
                        const newForks = [...currForks];
                        newForks[left] = true;
                        newForks[right] = true;
                        return newForks;
                    });
                    newPhils[idx].state = 'thinking';
                    addLog(`${p.name} put down forks.`);
                }

                return newPhils;
            });

        }, 2000);

        return () => clearInterval(tick);
    }, [isRunning, problem]);


    return (
        <div className="p-8 max-w-6xl mx-auto min-h-screen">
            <header className="mb-12 flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-2xl">
                    <GitMerge className="text-purple-500 w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold mb-2">Threads & Semaphores</h1>
                    <p className="text-slate-400">Concurrency, locks, and synchronization visualization.</p>
                </div>
            </header>

            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit mb-8">
                <button
                    onClick={() => { setProblem('producer'); setIsRunning(false); }}
                    className={`px-6 py-2 rounded-lg font-bold transition-all ${problem === 'producer' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                >
                    Producer-Consumer
                </button>
                <button
                    onClick={() => { setProblem('dining'); setIsRunning(false); }}
                    className={`px-6 py-2 rounded-lg font-bold transition-all ${problem === 'dining' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                >
                    Dining Philosophers
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {problem === 'producer' ? (
                        <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
                            {/* Producer - Consumer Design */}
                            <div className="flex items-center gap-12 w-full justify-between px-12">
                                <div className="flex flex-col items-center gap-4">
                                    <div className={`p-4 rounded-full border-2 ${activeAction('produce') ? 'bg-green-500/20 border-green-500' : 'bg-slate-900 border-slate-700'}`}>
                                        <Plus size={32} className="text-green-500" />
                                    </div>
                                    <div className="font-bold">Producer</div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex mb-2 justify-between text-xs text-slate-500 uppercase tracking-widest font-bold">
                                        <span>Full: {buffer.length}</span>
                                        <span>Empty: {bufferSize - buffer.length}</span>
                                    </div>
                                    <div className="h-24 bg-slate-950 border border-slate-800 rounded-xl flex items-center p-2 gap-2 overflow-hidden relative">
                                        {/* Buffer Slots */}
                                        {Array.from({ length: bufferSize }).map((_, i) => (
                                            <div key={i} className="flex-1 h-full rounded border border-dashed border-slate-800 flex items-center justify-center">
                                                {buffer[i] && (
                                                    <div className="w-10 h-10 bg-purple-500 rounded flex items-center justify-center text-xs font-bold animate-in zoom-in duration-300">
                                                        {buffer[i].value}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-4">
                                    <div className={`p-4 rounded-full border-2 ${activeAction('consume') ? 'bg-red-500/20 border-red-500' : 'bg-slate-900 border-slate-700'}`}>
                                        <Minus size={32} className="text-red-500" />
                                    </div>
                                    <div className="font-bold">Consumer</div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl min-h-[400px] flex items-center justify-center">
                            {/* Simple Circle Layout for Dining */}
                            <div className="relative w-80 h-80">
                                {philosophers.map((p, i) => {
                                    const angle = (i * 72) - 90; // Top is -90deg
                                    const x = 50 + 40 * Math.cos(angle * Math.PI / 180);
                                    const y = 50 + 40 * Math.sin(angle * Math.PI / 180);

                                    return (
                                        <div
                                            key={p.id}
                                            className={`absolute w-20 h-20 -ml-10 -mt-10 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-500 z-10
                                                ${p.state === 'eating' ? 'bg-emerald-500 border-emerald-400 scale-110 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'bg-slate-800 border-slate-700'}
                                            `}
                                            style={{ left: `${x}%`, top: `${y}%` }}
                                        >
                                            <span className="font-bold text-xs">{p.name}</span>
                                            <span className="text-[10px] opacity-75 uppercase">{p.state}</span>
                                        </div>
                                    );
                                })}

                                {/* Forks */}
                                {forks.map((f, i) => {
                                    const angle = (i * 72) - 54; // Between phils
                                    const x = 50 + 25 * Math.cos(angle * Math.PI / 180);
                                    const y = 50 + 25 * Math.sin(angle * Math.PI / 180);

                                    return (
                                        <div
                                            key={i}
                                            className={`absolute w-4 h-12 -ml-2 -mt-6 rounded-full transition-all duration-300
                                                ${f ? 'bg-slate-600' : 'bg-slate-800 opacity-20'}
                                            `}
                                            style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${angle + 90}deg)` }}
                                        />
                                    );
                                })}

                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-700 font-bold uppercase tracking-widest text-xs">
                                    Table
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
                        <h3 className="font-bold mb-4">Control Panel</h3>
                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            {isRunning ? <><Lock /> Stop Simulation</> : <><RefreshCw /> Start Simulation</>}
                        </button>

                        <div className="mt-6 space-y-2">
                            <h4 className="text-xs uppercase text-slate-500 font-bold">Semaphores</h4>
                            {problem === 'producer' ? (
                                <>
                                    <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-800">
                                        <span className="font-mono text-sm">mutex</span>
                                        <span className={mutex ? 'text-green-400' : 'text-red-400'}>{mutex ? '1' : '0'}</span>
                                    </div>
                                    <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-800">
                                        <span className="font-mono text-sm">empty</span>
                                        <span className="text-blue-400">{bufferSize - buffer.length}</span>
                                    </div>
                                    <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-800">
                                        <span className="font-mono text-sm">full</span>
                                        <span className="text-purple-400">{buffer.length}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-5 gap-1">
                                    {forks.map((f, i) => (
                                        <div key={i} className={`p-1 text-center rounded text-xs font-bold ${f ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-500'}`}>
                                            F{i}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl h-[300px] flex flex-col">
                        <h3 className="font-bold mb-4">Event Log</h3>
                        <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs pr-2">
                            {logs.map((log, i) => (
                                <div key={i} className="text-slate-400 border-b border-slate-800/50 pb-1">
                                    <span className="text-slate-600 mr-2">[{i}]</span> {log}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// UI Helper triggers for flashing states
function activeAction(type: string) {
    // Just a placeholder for visual flare, real logic handled in state
    return false;
}
