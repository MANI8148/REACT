#include <iostream>
#include <vector>
#include <unordered_set>
#include <deque>
#include <algorithm>
#include <map>
#include <emscripten/bind.h>

struct PageStep {
    int page;
    int step;
    std::vector<int> frames;
    bool fault;
};

class PageReplacement {
public:
    std::vector<PageStep> fifo(std::vector<int> pages, int capacity) {
        std::vector<PageStep> steps;
        std::vector<int> frames;
        std::deque<int> q;
        std::unordered_set<int> s;

        for (int i = 0; i < pages.size(); ++i) {
             int page = pages[i];
             bool is_fault = false;

             if (s.find(page) == s.end()) {
                 is_fault = true;
                 if (s.size() < capacity) {
                     s.insert(page);
                     q.push_back(page);
                     frames.push_back(page);
                 } else {
                     int val = q.front();
                     q.pop_front();
                     s.erase(val);
                     
                     // Find index of val in frames and replace (simplest frames maintenance)
                     // Since FIFO replaces oldest, we track frames differently or reconstruct.
                     // It is easier to maintain 'frames' vector representing current state.
                     for(int k=0; k<frames.size(); ++k) {
                         if(frames[k] == val) {
                             frames[k] = page;
                             break;
                         }
                     }
                     s.insert(page);
                     q.push_back(page);
                 }
             }
             steps.push_back({page, i, frames, is_fault});
        }
        return steps;
    }
    
    std::vector<PageStep> lru(std::vector<int> pages, int capacity) {
        std::vector<PageStep> steps;
        std::vector<int> frames; // To store current frames state
        
        // Using a vector to track usage history or timestamps
        // For small capacity, simple iteration is enough.
        
        for (int i = 0; i < pages.size(); ++i) {
            int page = pages[i];
            bool is_fault = false;
            
            auto it = std::find(frames.begin(), frames.end(), page);
            if (it == frames.end()) {
                is_fault = true;
                if (frames.size() < capacity) {
                    frames.push_back(page);
                } else {
                    // Find LRU
                    // Iterate backwards in pages from i-1 to 0. The one that appears last (or not at all) is LRU.
                    int lru_val = -1;
                    int earliest_last_use = i;
                    
                    int replace_idx = -1;

                    for(int idx = 0; idx < frames.size(); ++idx) {
                        int f = frames[idx];
                        int last_use = -1;
                        for(int j = i - 1; j >= 0; j--) {
                            if (pages[j] == f) {
                                last_use = j;
                                break;
                            }
                        }
                        if (last_use < earliest_last_use) {
                            earliest_last_use = last_use;
                            replace_idx = idx;
                        }
                    }
                    frames[replace_idx] = page;
                }
            }
            steps.push_back({page, i, frames, is_fault});
        }
        return steps;
    }
    
    std::vector<PageStep> optimal(std::vector<int> pages, int capacity) {
         std::vector<PageStep> steps;
         std::vector<int> frames;
         
         for (int i = 0; i < pages.size(); ++i) {
            int page = pages[i];
            bool is_fault = false;
            
            auto it = std::find(frames.begin(), frames.end(), page);
            if (it == frames.end()) {
                 is_fault = true;
                 if (frames.size() < capacity) {
                     frames.push_back(page);
                 } else {
                     // Find Optimal: replace page that will not be used for longest time
                     int replace_idx = -1;
                     int latest_use = -1;
                     
                     for(int idx = 0; idx < frames.size(); ++idx) {
                         int f = frames[idx];
                         int first_use = INT_MAX;
                         for(int j = i + 1; j < pages.size(); ++j) {
                             if (pages[j] == f) {
                                 first_use = j;
                                 break;
                             }
                         }
                         if (first_use == INT_MAX) {
                             replace_idx = idx;
                             break; // Keep this one, it's not used again.
                         } else {
                             if (first_use > latest_use) {
                                 latest_use = first_use;
                                 replace_idx = idx;
                             }
                         }
                     }
                     if (replace_idx == -1) replace_idx = 0; // Fallback? Logic guarantees finding one.
                     frames[replace_idx] = page;
                 }
            }
            steps.push_back({page, i, frames, is_fault});
         }
         return steps;
    }
    std::vector<PageStep> lfu(std::vector<int> pages, int capacity) {
        std::vector<PageStep> steps;
        std::vector<int> frames;
        std::map<int, int> frequency;

        for (int i = 0; i < pages.size(); ++i) {
            int page = pages[i];
            bool is_fault = false;
            frequency[page]++;

            auto it = std::find(frames.begin(), frames.end(), page);
            if (it == frames.end()) {
                is_fault = true;
                if (frames.size() < capacity) {
                    frames.push_back(page);
                } else {
                    int replace_idx = -1;
                    int min_freq = INT_MAX;
                    for(int idx = 0; idx < frames.size(); ++idx) {
                        int f = frames[idx];
                        if (frequency[f] < min_freq) {
                            min_freq = frequency[f];
                            replace_idx = idx;
                        }
                    }
                    frames[replace_idx] = page;
                }
            }
            steps.push_back({page, i, frames, is_fault});
        }
        return steps;
    }

    std::vector<PageStep> mfu(std::vector<int> pages, int capacity) {
        std::vector<PageStep> steps;
        std::vector<int> frames;
        std::map<int, int> frequency;

        for (int i = 0; i < pages.size(); ++i) {
            int page = pages[i];
            bool is_fault = false;
            frequency[page]++;

            auto it = std::find(frames.begin(), frames.end(), page);
            if (it == frames.end()) {
                is_fault = true;
                if (frames.size() < capacity) {
                    frames.push_back(page);
                } else {
                    int replace_idx = -1;
                    int max_freq = -1;
                    for(int idx = 0; idx < frames.size(); ++idx) {
                        int f = frames[idx];
                        if (frequency[f] > max_freq) {
                            max_freq = frequency[f];
                            replace_idx = idx;
                        }
                    }
                    frames[replace_idx] = page;
                }
            }
            steps.push_back({page, i, frames, is_fault});
        }
        return steps;
    }
};

using namespace emscripten;

EMSCRIPTEN_BINDINGS(memory_page_module) {
    value_object<PageStep>("PageStep")
        .field("page", &PageStep::page)
        .field("step", &PageStep::step)
        .field("frames", &PageStep::frames)
        .field("fault", &PageStep::fault);

    register_vector<int>("vector<int>");
    register_vector<PageStep>("vector<PageStep>");

    class_<PageReplacement>("PageReplacement")
        .constructor<>()
        .function("fifo", &PageReplacement::fifo)
        .function("lru", &PageReplacement::lru)
        .function("optimal", &PageReplacement::optimal)
        .function("lfu", &PageReplacement::lfu)
        .function("mfu", &PageReplacement::mfu);
}
