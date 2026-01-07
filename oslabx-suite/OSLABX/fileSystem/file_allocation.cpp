#include <iostream>
#include <vector>
#include <string>
#include <map>
#include <algorithm>
#include <climits>
#include <emscripten/bind.h>

struct FileInfo {
    int id;
    int size;
    // For Contiguous: start block, length
    int startBlock;
    int length;
    // For Linked/Indexed: list of blocks
    std::vector<int> blocks;
};

struct DiskBlock {
    int id;
    int fileId; // -1 if free
    int nextBlock; // For linked allocation, -1 if end or not used
};

struct AllocationResult {
    std::vector<DiskBlock> disk;
    std::vector<FileInfo> files;
    bool success;
};

class FileAllocationManager {
public:
    AllocationResult contiguous(int totalBlocks, std::vector<FileInfo> filesRequest) {
        std::vector<DiskBlock> disk(totalBlocks);
        for(int i=0; i<totalBlocks; ++i) {
            disk[i] = {i, -1, -1};
        }

        std::vector<FileInfo> allocatedFiles;

        // Simple First Fit for Contiguous
        for (auto& file : filesRequest) {
            int requiredBlocks = file.size; // Assuming size is in blocks for simplicity
            bool allocated = false;
            
            int currentRun = 0;
            int start = -1;

            for (int i = 0; i < totalBlocks; ++i) {
                if (disk[i].fileId == -1) {
                    if (currentRun == 0) start = i;
                    currentRun++;
                    if (currentRun == requiredBlocks) {
                        // Allocate
                        allocated = true;
                        file.startBlock = start;
                        file.length = requiredBlocks;
                        for (int k = start; k < start + requiredBlocks; ++k) {
                            disk[k].fileId = file.id;
                            file.blocks.push_back(k);
                        }
                        allocatedFiles.push_back(file);
                        break;
                    }
                } else {
                    currentRun = 0;
                    start = -1;
                }
            }
        }
        return {disk, allocatedFiles, true};
    }

    AllocationResult linked(int totalBlocks, std::vector<FileInfo> filesRequest) {
        std::vector<DiskBlock> disk(totalBlocks);
        for(int i=0; i<totalBlocks; ++i) {
            disk[i] = {i, -1, -1};
        }
        
        std::vector<FileInfo> allocatedFiles;
        std::vector<int> freeBlocks;
        for(int i=0; i<totalBlocks; ++i) freeBlocks.push_back(i);

        // Simple random allocation for Linked
        // In real FS, it picks first available free block
        for (auto& file : filesRequest) {
            int required = file.size;
            if (freeBlocks.size() >= required) {
                int prev = -1;
                for (int k = 0; k < required; ++k) {
                    // Pick a "random" or next free block (simulated by front since we populated sequentially)
                    // shuffle to make it look "linked" non-contiguous? No, let's keep it simple first
                    // Actually, if we just pick sequentially it looks like contiguous.
                    // Let's allocation random blocks to demonstrate linked nature if we have fragmentation.
                    // But here disk is empty initially. 
                    
                    int blockIdx = freeBlocks.front();
                    freeBlocks.erase(freeBlocks.begin()); // inefficient but fine for small sim

                    disk[blockIdx].fileId = file.id;
                    file.blocks.push_back(blockIdx);

                    if (prev != -1) {
                        disk[prev].nextBlock = blockIdx;
                    }
                    prev = blockIdx;
                }
                file.startBlock = file.blocks[0]; // Head
                allocatedFiles.push_back(file);
            }
        }

        return {disk, allocatedFiles, true};
    }

    AllocationResult indexed(int totalBlocks, std::vector<FileInfo> filesRequest) {
        std::vector<DiskBlock> disk(totalBlocks);
        for(int i=0; i<totalBlocks; ++i) {
            disk[i] = {i, -1, -1};
        }
        
        std::vector<FileInfo> allocatedFiles;
        std::vector<int> freeBlocks;
        for(int i=0; i<totalBlocks; ++i) freeBlocks.push_back(i);

        for (auto& file : filesRequest) {
            int requiredData = file.size;
            // Need 1 index block + data blocks
            if (freeBlocks.size() >= requiredData + 1) {
                // Allocate Index Block
                int indexRun = freeBlocks.front();
                freeBlocks.erase(freeBlocks.begin());
                
                disk[indexRun].fileId = file.id; // Index block marked with file ID too? Or special?
                // Let's mark it as file ID but visualize differently in frontend perhaps

                file.startBlock = indexRun; // Index Block is usually the "start" pointer from directory
                
                // Allocate Data Blocks
                for (int k = 0; k < requiredData; ++k) {
                    int blockIdx = freeBlocks.front();
                    freeBlocks.erase(freeBlocks.begin());

                    disk[blockIdx].fileId = file.id;
                    file.blocks.push_back(blockIdx);
                    
                    // In real indexed, index block contains list of these blocks.
                    // effectively `disk[indexRun].pointers.push_back(blockIdx)`
                    // We simulate this by just storing in file info for now
                }
                allocatedFiles.push_back(file);
            }
        }
        return {disk, allocatedFiles, true};
    }
};

using namespace emscripten;

EMSCRIPTEN_BINDINGS(file_allocation_module) {
    value_object<FileInfo>("FileInfo")
        .field("id", &FileInfo::id)
        .field("size", &FileInfo::size)
        .field("startBlock", &FileInfo::startBlock)
        .field("length", &FileInfo::length)
        .field("blocks", &FileInfo::blocks);

    value_object<DiskBlock>("DiskBlock")
        .field("id", &DiskBlock::id)
        .field("fileId", &DiskBlock::fileId)
        .field("nextBlock", &DiskBlock::nextBlock);

    value_object<AllocationResult>("AllocationResult")
        .field("disk", &AllocationResult::disk)
        .field("files", &AllocationResult::files)
        .field("success", &AllocationResult::success);

    register_vector<int>("vector<int>");
    register_vector<FileInfo>("vector<FileInfo>");
    register_vector<DiskBlock>("vector<DiskBlock>");

    class_<FileAllocationManager>("FileAllocationManager")
        .constructor<>()
        .function("contiguous", &FileAllocationManager::contiguous)
        .function("linked", &FileAllocationManager::linked)
        .function("indexed", &FileAllocationManager::indexed);
}
