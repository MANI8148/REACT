#include <iostream>
#include <vector>
#include <algorithm>
#include <climits>
#include <emscripten/bind.h>

struct MemoryBlock {
    int id;
    int size;
    bool allocated;
    int process_id; // -1 if free
};

struct ProcessRequest {
    int id;
    int size;
    bool allocated;
    int block_id; // -1 if not allocated
};

struct AllocationResult {
    std::vector<MemoryBlock> blocks;
    std::vector<ProcessRequest> processes;
};

class MemoryManager {
public:
    AllocationResult first_fit(std::vector<MemoryBlock> blocks, std::vector<ProcessRequest> processes) {
        for (auto& p : processes) {
            for (auto& b : blocks) {
                if (!b.allocated && b.size >= p.size) {
                    b.allocated = true;
                    b.process_id = p.id;
                    p.allocated = true;
                    p.block_id = b.id;
                    break;
                }
            }
        }
        return {blocks, processes};
    }

    AllocationResult best_fit(std::vector<MemoryBlock> blocks, std::vector<ProcessRequest> processes) {
        for (auto& p : processes) {
            int best_idx = -1;
            int min_frag = INT_MAX;
            for (int i=0; i<blocks.size(); ++i) {
                if (!blocks[i].allocated && blocks[i].size >= p.size) {
                    int frag = blocks[i].size - p.size;
                    if (frag < min_frag) {
                        min_frag = frag;
                        best_idx = i;
                    }
                }
            }
            if (best_idx != -1) {
                blocks[best_idx].allocated = true;
                blocks[best_idx].process_id = p.id;
                p.allocated = true;
                p.block_id = blocks[best_idx].id;
            }
        }
        return {blocks, processes};
    }

    AllocationResult worst_fit(std::vector<MemoryBlock> blocks, std::vector<ProcessRequest> processes) {
        for (auto& p : processes) {
             int worst_idx = -1;
             int max_frag = -1;
             for (int i=0; i<blocks.size(); ++i) {
                if (!blocks[i].allocated && blocks[i].size >= p.size) {
                    int frag = blocks[i].size - p.size;
                    if (frag > max_frag) {
                        max_frag = frag;
                        worst_idx = i;
                    }
                }
             }

             if (worst_idx != -1) {
                blocks[worst_idx].allocated = true;
                blocks[worst_idx].process_id = p.id;
                p.allocated = true;
                p.block_id = blocks[worst_idx].id;
             }
        }
        return {blocks, processes};
    }
};

using namespace emscripten;

EMSCRIPTEN_BINDINGS(memory_fit_module) {
    value_object<MemoryBlock>("MemoryBlock")
        .field("id", &MemoryBlock::id)
        .field("size", &MemoryBlock::size)
        .field("allocated", &MemoryBlock::allocated)
        .field("process_id", &MemoryBlock::process_id);

    value_object<ProcessRequest>("ProcessRequest")
        .field("id", &ProcessRequest::id)
        .field("size", &ProcessRequest::size)
        .field("allocated", &ProcessRequest::allocated)
        .field("block_id", &ProcessRequest::block_id);

    value_object<AllocationResult>("AllocationResult")
        .field("blocks", &AllocationResult::blocks)
        .field("processes", &AllocationResult::processes);

    register_vector<MemoryBlock>("vector<MemoryBlock>");
    register_vector<ProcessRequest>("vector<ProcessRequest>");
    
    class_<MemoryManager>("MemoryManager")
        .constructor<>()
        .function("first_fit", &MemoryManager::first_fit)
        .function("best_fit", &MemoryManager::best_fit)
        .function("worst_fit", &MemoryManager::worst_fit);
}
