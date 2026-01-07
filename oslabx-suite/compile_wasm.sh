#!/bin/bash
set -e

echo "Compiling WASM modules..."
mkdir -p frontend/public/wasm

# API Options for reusable modules
OPTS="-O3 -s WASM=1 -s MODULARIZE=1 -s ALLOW_MEMORY_GROWTH=1 --bind"

# Scheduler
echo "Compiling FCFS..."
emcc OSLABX/scheduler/fcfs.cpp -o frontend/public/wasm/fcfs.js $OPTS -s EXPORT_NAME='createFCFSModule'
echo "Compiling SJF..."
emcc OSLABX/scheduler/sjf.cpp -o frontend/public/wasm/sjf.js $OPTS -s EXPORT_NAME='createSJFModule'
echo "Compiling Round Robin..."
emcc OSLABX/scheduler/round_robin.cpp -o frontend/public/wasm/round_robin.js $OPTS -s EXPORT_NAME='createRRModule'
echo "Compiling Priority..."
emcc OSLABX/scheduler/priority.cpp -o frontend/public/wasm/priority.js $OPTS -s EXPORT_NAME='createPriorityModule'

# Memory
echo "Compiling Memory Fit..."
emcc OSLABX/memory/fit_strategies.cpp -o frontend/public/wasm/memory_fit.js $OPTS -s EXPORT_NAME='createMemoryFitModule'
echo "Compiling Page Replacement..."
emcc OSLABX/memory/page_replacement.cpp -o frontend/public/wasm/page_replacement.js $OPTS -s EXPORT_NAME='createPageReplacementModule'

# Disk
echo "Compiling Disk Scheduling..."
emcc OSLABX/disk/disk_scheduling.cpp -o frontend/public/wasm/disk_scheduling.js $OPTS -s EXPORT_NAME='createDiskSchedulingModule'

# File System
echo "Compiling File Allocation..."
emcc OSLABX/fileSystem/file_allocation.cpp -o frontend/public/wasm/file_allocation.js $OPTS -s EXPORT_NAME='createFileAllocationModule'

# Deadlock
echo "Compiling Banker..."
emcc OSLABX/deadlock/banker.cpp -o frontend/public/wasm/banker.js $OPTS -s EXPORT_NAME='createBankerModule'

echo "WASM compilation complete."
