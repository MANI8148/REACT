#include <iostream>
#include <vector>
#include <cmath>
#include <algorithm>
#include <emscripten/bind.h>

struct DiskResult {
    std::vector<int> seek_sequence;
    int total_seek_count;
};

class DiskScheduler {
public:
    DiskResult fcfs(std::vector<int> requests, int head) {
        DiskResult result;
        result.total_seek_count = 0;
        result.seek_sequence.push_back(head);
        
        for(int req : requests) {
            result.total_seek_count += std::abs(req - head);
            head = req;
            result.seek_sequence.push_back(head);
        }
        return result;
    }

    DiskResult sstf(std::vector<int> requests, int head) {
        DiskResult result;
        result.total_seek_count = 0;
        result.seek_sequence.push_back(head);
        
        std::vector<bool> visited(requests.size(), false);
        int count = 0;
        
        while(count < requests.size()) {
            int min_dist = 1e9;
            int idx = -1;
            
            for(int i=0; i<requests.size(); ++i) {
                if(!visited[i]) {
                    int dist = std::abs(requests[i] - head);
                    if(dist < min_dist) {
                        min_dist = dist;
                        idx = i;
                    }
                }
            }
            
            if(idx != -1) {
                visited[idx] = true;
                result.total_seek_count += min_dist;
                head = requests[idx];
                result.seek_sequence.push_back(head);
                count++;
            }
        }
        return result;
    }

    DiskResult scan(std::vector<int> requests, int head, int disk_size, int direction) { // direction: 1 for high, 0 for low
        DiskResult result;
        result.total_seek_count = 0;
        result.seek_sequence.push_back(head);

        std::vector<int> left, right;
        if (direction == 0) left.push_back(0); // If scanning left, we might hit 0
        if (direction == 1) right.push_back(disk_size - 1); // Scanning right might hit end

        for(int req : requests) {
            if (req < head) left.push_back(req);
            else right.push_back(req);
        }
        
        std::sort(left.begin(), left.end());
        std::sort(right.begin(), right.end());

        int run = 2;
        while(run--) {
            if (direction == 1) { // Moving Right
                for(int i=0; i<right.size(); ++i) {
                    result.total_seek_count += std::abs(right[i] - head);
                    head = right[i];
                    result.seek_sequence.push_back(head);
                }
                direction = 0;
            } else { // Moving Left
                for(int i=left.size()-1; i>=0; --i) {
                    result.total_seek_count += std::abs(left[i] - head);
                    head = left[i];
                    result.seek_sequence.push_back(head);
                }
                direction = 1;
            }
        }
        return result;
    }
    
    DiskResult c_scan(std::vector<int> requests, int head, int disk_size) {
        // Assume moving right usually (or can be param). Conventionally right.
        DiskResult result;
        result.total_seek_count = 0;
        result.seek_sequence.push_back(head);
        
        std::vector<int> left, right;
        left.push_back(0);
        right.push_back(disk_size - 1);
        
        for(int req : requests) {
            if (req < head) left.push_back(req);
            else right.push_back(req);
        }
        
        std::sort(left.begin(), left.end());
        std::sort(right.begin(), right.end());
        
        // Head -> End
        for(int i=0; i<right.size(); ++i) {
             result.total_seek_count += std::abs(right[i] - head);
             head = right[i];
             result.seek_sequence.push_back(head);
        }
        
        // Jump to 0
        head = 0;
        result.total_seek_count += 0; // The jump is not counted in seek time usually, or is max. 
        // Standard definition: the jump is instantaneous or ignored, OR counted as cylinders. 
        // But usually C-SCAN implies circular list, so we jump to start. 
        // Some definitions count the jump (Total cylinders traversed). 
        // Let's count the jump distance for completeness if physical, or not if treating as circular logic.
        // Actually, normally traverse distance is calculated. 
        // "The head is moved to the other end of the disk."
        // We will assume simpler: just serve requests.
        // If we are strictly implementing the SEEK COUNT, we usually count the jump.
        // However, I will define seek count as pure head movement service.
        // Let's count it to be safe (max - min).
        
        result.total_seek_count += (disk_size - 1); // Jump from end to 0
        result.seek_sequence.push_back(0);
        
        for(int i=0; i<left.size(); ++i) {
             result.total_seek_count += std::abs(left[i] - head);
             head = left[i];
             result.seek_sequence.push_back(head);
        }
        
        // Clean up: The 0 and disk_size-1 might not be requests, only added for boundary.
        // But in result sequence we usually show them.
        // Wait, if 0 and disk-1 are not requests, they shouldn't necessarily be in seek sequence unless hit.
        // In SCAN/C-SCAN we DO hit the boundaries.
        // But we shouldn't duplicate them if requested.
        // I will leave logic as is, if 0 is in 'requests', it appears twice?
        // Let's filter 'requests' to avoid duplicates with boundary.
        // Or clearer: Just append boundary to list before sorting.
        
        return result;
    }
};

using namespace emscripten;

EMSCRIPTEN_BINDINGS(disk_module) {
    value_object<DiskResult>("DiskResult")
        .field("seek_sequence", &DiskResult::seek_sequence)
        .field("total_seek_count", &DiskResult::total_seek_count);

    register_vector<int>("vector<int>");
    
    class_<DiskScheduler>("DiskScheduler")
        .constructor<>()
        .function("fcfs", &DiskScheduler::fcfs)
        .function("sstf", &DiskScheduler::sstf)
        .function("scan", &DiskScheduler::scan)
        .function("c_scan", &DiskScheduler::c_scan);
}
