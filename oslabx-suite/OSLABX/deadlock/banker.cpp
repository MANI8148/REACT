#include <iostream>
#include <vector>
#include <emscripten/bind.h>

struct BankerResult {
    bool is_safe;
    std::vector<int> safe_sequence;
};

class Banker {
public:
    // Simplify parameters: Flatt arrays for matricies because nested vector binding is annoying
    // max: n*m, allocation: n*m, available: m
    BankerResult solve(int n, int m, std::vector<int> allocation, std::vector<int> max, std::vector<int> available) {
        std::vector<int> work = available;
        std::vector<bool> finish(n, false);
        std::vector<int> safe_seq;
        
        std::vector<std::vector<int>> alloc_mat(n, std::vector<int>(m));
        std::vector<std::vector<int>> max_mat(n, std::vector<int>(m));
        std::vector<std::vector<int>> need_mat(n, std::vector<int>(m));
        
        // Reconstruct matrices
        for(int i=0; i<n; ++i) {
            for(int j=0; j<m; ++j) {
                alloc_mat[i][j] = allocation[i*m + j];
                max_mat[i][j] = max[i*m + j];
                need_mat[i][j] = max_mat[i][j] - alloc_mat[i][j];
            }
        }
        
        int count = 0;
        while (count < n) {
            bool found = false;
            for (int p = 0; p < n; p++) {
                if (!finish[p]) {
                    int j;
                    for (j = 0; j < m; j++)
                        if (need_mat[p][j] > work[j])
                            break;

                    if (j == m) {
                        for (int k = 0; k < m; k++)
                            work[k] += alloc_mat[p][k];
                        safe_seq.push_back(p);
                        finish[p] = true;
                        found = true;
                        count++;
                    }
                }
            }
            if (!found) {
                return {false, {}}; // Unsafe
            }
        }
        
        return {true, safe_seq};
    }
};

using namespace emscripten;

EMSCRIPTEN_BINDINGS(banker_module) {
    value_object<BankerResult>("BankerResult")
        .field("is_safe", &BankerResult::is_safe)
        .field("safe_sequence", &BankerResult::safe_sequence);
        
    register_vector<int>("vector<int>");
    // Nested vectors are avoided in interface for simplicity.

    class_<Banker>("Banker")
        .constructor<>()
        .function("solve", &Banker::solve);
}
