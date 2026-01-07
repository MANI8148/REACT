'use client';

import React, { useState } from 'react';
import { useWasmModule } from '@/hooks/useWasmModule';
import { DiskSchedulerModule, DiskResult, FileAllocationModule, FileAllocationResult, FileInfo, DiskBlock } from '@/types/wasm';
import { HardDrive, Play, RotateCcw, Database, Layers } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FileSystemPage() {
    const [activeTab, setActiveTab] = useState<'scheduling' | 'allocation'>('scheduling');

    // --- DISK SCHEDULING STATE ---
    const [algo, setAlgo] = useState<'fcfs' | 'sstf' | 'scan' | 'c_scan'>('fcfs');
    const [head, setHead] = useState(50);
    const [diskSize, setDiskSize] = useState(200);
    const [requestString, setRequestString] = useState('82,170,43,140,24,16,190');
    const [result, setResult] = useState<DiskResult | null>(null);
    const [graphData, setGraphData] = useState<any[]>([]);

    const diskModule = useWasmModule<DiskSchedulerModule>('/wasm/disk_scheduling.js', 'createDiskSchedulingModule');

    const runSimulation = () => {
        if (!diskModule.module) return;
        try {
            const { DiskScheduler, 'vector<int>': VecInt } = diskModule.module;
            const scheduler = new DiskScheduler();
            const vec = new VecInt();
            const requests = requestString.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));

            requests.forEach(r => vec.push_back(r));

            let res: DiskResult;
            if (algo === 'fcfs') res = scheduler.fcfs(vec, head);
            else if (algo === 'sstf') res = scheduler.sstf(vec, head);
            else if (algo === 'scan') res = scheduler.scan(vec, head, diskSize, 1);
            else res = scheduler.c_scan(vec, head, diskSize);

            const sequence: number[] = [];
            const wasmSeq = res.seek_sequence;
            for (let i = 0; i < wasmSeq.size(); i++) sequence.push(wasmSeq.get(i));

            setResult({
                seek_sequence: sequence,
                total_seek_count: res.total_seek_count
            });

            const data = sequence.map((track, i) => ({ step: i, track }));
            setGraphData(data);

            scheduler.delete();
            vec.delete();
        } catch (e) { console.error(e); }
    };

    // --- FILE ALLOCATION STATE ---
    const [allocAlgo, setAllocAlgo] = useState<'contiguous' | 'linked' | 'indexed'>('contiguous');
    const [totalBlocks, setTotalBlocks] = useState(50);
    const [files, setFiles] = useState<Array<{ id: number, size: number }>>([
        { id: 1, size: 5 }, { id: 2, size: 3 }, { id: 3, size: 4 }
    ]);
    const [allocResult, setAllocResult] = useState<{ disk: DiskBlock[], fileInfos: FileInfo[] } | null>(null);

    const allocModule = useWasmModule<FileAllocationModule>('/wasm/file_allocation.js', 'createFileAllocationModule');

    const runAllocation = () => {
        if (!allocModule.module) return;
        try {
            const { FileAllocationManager, 'vector<FileInfo>': VecFiles } = allocModule.module;
            const manager = new FileAllocationManager();
            const vecFiles = new VecFiles();

            files.forEach(f => {
                // We only need to pass ID and Size really, blocks are empty initially
                vecFiles.push_back({
                    id: f.id,
                    size: f.size,
                    startBlock: -1,
                    length: 0,
                    blocks: undefined // vector handled by C++ binding usually if omitted or empty
                    // Note: Emscripten binding expects full object match or proper construction. 
                    // Since 'blocks' is vector, we might need to construct it if binding is strict.
                    // For input, simple object usually works if fields match.
                } as any);
            });

            let res: FileAllocationResult;
            if (allocAlgo === 'contiguous') res = manager.contiguous(totalBlocks, vecFiles);
            else if (allocAlgo === 'linked') res = manager.linked(totalBlocks, vecFiles);
            else res = manager.indexed(totalBlocks, vecFiles);

            // Convert result to JS arrays
            const diskBlocks: DiskBlock[] = [];
            const diskVec = res.disk;
            for (let i = 0; i < diskVec.size(); i++) diskBlocks.push(diskVec.get(i));

            const fileInfos: FileInfo[] = [];
            const filesVec = res.files;
            for (let i = 0; i < filesVec.size(); i++) {
                const f = filesVec.get(i);

                // Extract inner vector
                const blks: number[] = [];
                const bVec = f.blocks;
                for (let k = 0; k < bVec.size(); k++) blks.push(bVec.get(k));

                fileInfos.push({
                    ...f,
                    blockArray: blks
                });
            }

            setAllocResult({
                disk: diskBlocks,
                fileInfos: fileInfos
            });

            manager.delete();
            vecFiles.delete();

        } catch (e) { console.error(e); }
    };

    const getBlockColor = (fileId: number) => {
        if (fileId === -1) return 'bg-slate-800/50 border-slate-700';
        const colors = [
            'bg-blue-500 border-blue-400',
            'bg-purple-500 border-purple-400',
            'bg-emerald-500 border-emerald-400',
            'bg-orange-500 border-orange-400',
            'bg-pink-500 border-pink-400',
            'bg-cyan-500 border-cyan-400',
        ];
        return colors[(fileId - 1) % colors.length];
    };

    return (
        <div className="p-8 max-w-6xl mx-auto min-h-screen">
            <header className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl">
                        <HardDrive className="text-indigo-500 w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold mb-2">File System</h1>
                        <p className="text-slate-400">Disk Scheduling & File Allocation Strategies</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setActiveTab('scheduling')}
                        className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${activeTab === 'scheduling' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Layers size={18} /> Disk Scheduling
                    </button>
                    <button
                        onClick={() => setActiveTab('allocation')}
                        className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${activeTab === 'allocation' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Database size={18} /> File Allocation
                    </button>
                </div>
            </header>

            {activeTab === 'scheduling' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <h3 className="font-bold mb-4">Settings</h3>

                            <label className="block text-sm text-slate-400 mb-2">Algorithm</label>
                            <select className="w-full bg-slate-950 p-2 rounded mb-4 border border-slate-800" value={algo} onChange={(e: any) => setAlgo(e.target.value)}>
                                <option value="fcfs">FCFS</option>
                                <option value="sstf">SSTF</option>
                                <option value="scan">SCAN</option>
                                <option value="c_scan">C-SCAN</option>
                            </select>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Initial Head</label>
                                    <input type="number" className="w-full bg-slate-950 p-2 rounded border border-slate-800" value={head} onChange={(e) => setHead(Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Disk Size</label>
                                    <input type="number" className="w-full bg-slate-950 p-2 rounded border border-slate-800" value={diskSize} onChange={(e) => setDiskSize(Number(e.target.value))} />
                                </div>
                            </div>

                            <label className="block text-sm text-slate-400 mb-2">Request Queue (csv)</label>
                            <input className="w-full bg-slate-950 p-2 rounded border border-slate-800 mb-6" value={requestString} onChange={(e) => setRequestString(e.target.value)} />

                            <button onClick={runSimulation} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-xl font-bold flex items-center justify-center gap-2">
                                <Play size={18} /> Schedule Disk
                            </button>
                        </div>

                        {result && (
                            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                                <h3 className="font-bold mb-4">Results</h3>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-400">Total Seek Count</span>
                                    <span className="text-xl font-bold text-indigo-400">{result.total_seek_count}</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-4 break-words font-mono">
                                    SEQ: {JSON.stringify(result.seek_sequence)}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-2">
                        <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 min-h-[500px] flex flex-col">
                            <h3 className="font-bold mb-6">Seek Operation Graph</h3>
                            {graphData.length > 0 ? (
                                <div style={{ width: '100%', height: '400px', minHeight: '400px' }}>
                                    <ResponsiveContainer width="99%" height="100%" minWidth={0}>
                                        <LineChart data={graphData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                            <XAxis dataKey="step" tick={{ fill: '#64748b' }} label={{ value: 'Step', position: 'insideBottom', offset: -10, fill: '#64748b' }} />
                                            <YAxis domain={[0, diskSize]} tick={{ fill: '#64748b' }} label={{ value: 'Track Number', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }}
                                                itemStyle={{ color: '#818cf8' }}
                                            />
                                            <Line type="monotone" dataKey="track" stroke="#818cf8" strokeWidth={2} dot={{ fill: '#818cf8', r: 4 }} activeDot={{ r: 8 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                                    No simulation data
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                // --- FILE ALLOCATION TAB ---
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <h3 className="font-bold mb-4">Settings</h3>
                            <label className="block text-sm text-slate-400 mb-2">Strategy</label>
                            <select className="w-full bg-slate-950 p-2 rounded mb-4 border border-slate-800" value={allocAlgo} onChange={(e: any) => setAllocAlgo(e.target.value)}>
                                <option value="contiguous">Contiguous Allocation</option>
                                <option value="linked">Linked Allocation</option>
                                <option value="indexed">Indexed Allocation</option>
                            </select>

                            <label className="block text-sm text-slate-400 mb-2">Total Disk Blocks</label>
                            <input type="number" className="w-full bg-slate-950 p-2 rounded border border-slate-800 mb-6" value={totalBlocks} onChange={(e) => setTotalBlocks(Number(e.target.value))} />

                            <div className="mb-6">
                                <label className="block text-xs uppercase text-slate-500 mb-2">Files (ID: Size)</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="number"
                                        placeholder="Size"
                                        className="w-full bg-slate-950 p-2 rounded border border-slate-800"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = parseInt(e.currentTarget.value);
                                                if (!isNaN(val) && val > 0) {
                                                    setFiles([...files, { id: files.length + 1, size: val }]);
                                                    e.currentTarget.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button onClick={() => setFiles([])} className="px-3 py-2 bg-red-500/10 text-red-400 rounded"><RotateCcw size={16} /></button>
                                </div>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {files.map(f => (
                                        <div key={f.id} className="flex justify-between text-xs bg-slate-950 p-2 rounded items-center">
                                            <span>File {f.id}: {f.size} blocks</span>
                                            <button onClick={() => setFiles(files.filter(x => x.id !== f.id))} className="text-red-400">×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button onClick={runAllocation} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-xl font-bold flex items-center justify-center gap-2">
                                <Play size={18} /> Allocate Files
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 min-h-[500px]">
                            <h3 className="font-bold mb-6">Disk Block Map</h3>
                            {allocResult ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-10 gap-2">
                                        {allocResult.disk.map((block) => (
                                            <div
                                                key={block.id}
                                                className={`aspect-square rounded-lg flex flex-col items-center justify-center border-2 text-xs relative group ${getBlockColor(block.fileId)}`}
                                            >
                                                <span className="font-bold">{block.id}</span>
                                                {block.fileId !== -1 && <span className="opacity-75">F{block.fileId}</span>}

                                                {/* Tooltip for Linking */}
                                                {(allocAlgo === 'linked' && block.nextBlock !== -1) && (
                                                    <div className="absolute -top-8 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                                        Next: {block.nextBlock}
                                                    </div>
                                                )}
                                                {allocAlgo === 'linked' && block.nextBlock !== -1 && (
                                                    <div className="absolute bottom-1 right-1 w-2 h-2 bg-white/50 rounded-full" title={`Next: ${block.nextBlock}`} />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* FAT / Index Table visualization */}
                                    <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                                        <h4 className="font-bold text-sm text-slate-400 mb-3">Allocation Table</h4>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            {allocResult.fileInfos.map(f => (
                                                <div key={f.id} className="bg-slate-900 p-2 rounded border border-slate-800">
                                                    <div className="font-bold mb-1">File {f.id}</div>
                                                    <div className="text-xs text-slate-500">
                                                        {allocAlgo === 'contiguous' && <>Start: {f.startBlock} | Len: {f.length}</>}
                                                        {allocAlgo === 'linked' && <>Start: {f.startBlock} | End: {f.blockArray?.[f.blockArray.length - 1]}</>}
                                                        {allocAlgo === 'indexed' && <>Index Block: {f.startBlock}</>}
                                                    </div>
                                                    <div className="text-[10px] text-slate-600 mt-1 break-words">
                                                        {f.blockArray?.join(' -> ')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                                    Run allocation to see disk map
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
