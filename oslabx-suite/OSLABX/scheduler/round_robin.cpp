#include <iostream>
#include <vector>
#include <algorithm>
#include <queue>
#include <emscripten/bind.h>

struct Process {
    int id;
    int burst_time;
    int arrival_time;
    int remaining_time;
    int completion_time;
    int waiting_time;
    int turn_around_time;
};

class Scheduler {
public:
    std::vector<Process> round_robin(std::vector<Process> processes, int time_quantum) {
        std::sort(processes.begin(), processes.end(), [](const Process& a, const Process& b) {
            return a.arrival_time < b.arrival_time;
        });

        int n = processes.size();
        std::vector<int> rem_bt(n);
        for(int i=0; i<n; i++) rem_bt[i] = processes[i].burst_time;

        int current_time = 0;
        std::queue<int> q;
        std::vector<bool> in_queue(n, false);
        int completed = 0;

        // Push first process(es)
        if (n > 0) {
            // Move time to first process arrival if needed
            if (processes[0].arrival_time > current_time)
                current_time = processes[0].arrival_time;
                
            // Push all processes that have arrived at start
            int i = 0;
            while(i < n && processes[i].arrival_time <= current_time) {
               q.push(i);
               in_queue[i] = true;
               i++;
            }
            
            // If queue is empty (gap at start), find next arrival
            if (q.empty()) {
                current_time = processes[0].arrival_time;
                while(i < n && processes[i].arrival_time <= current_time) {
                    q.push(i);
                    in_queue[i] = true;
                    i++;
                }
            }
        }

        while(completed < n) {
            if (q.empty()) {
                // If queue empty but processes remain, jump to next arrival
                int next_arrival_idx = -1;
                for(int i=0; i<n; i++) {
                    if (!in_queue[i] && rem_bt[i] > 0) { // Check rem_bt just in case logic flaw
                         next_arrival_idx = i;
                         break;
                    }
                }
                
                if (next_arrival_idx != -1) {
                    current_time = processes[next_arrival_idx].arrival_time;
                    int i = next_arrival_idx;
                    while(i < n && processes[i].arrival_time <= current_time) {
                        q.push(i);
                        in_queue[i] = true;
                        i++;
                    }
                } else {
                    break;
                }
            }

            int idx = q.front();
            q.pop();

            int execute_time = std::min(time_quantum, rem_bt[idx]);
            rem_bt[idx] -= execute_time;
            current_time += execute_time;

            // Check for new arrivals
            for(int i=0; i<n; i++) {
                if (!in_queue[i] && processes[i].arrival_time <= current_time && rem_bt[i] > 0) {
                    q.push(i);
                    in_queue[i] = true;
                }
            }

            if (rem_bt[idx] > 0) {
                q.push(idx);
            } else {
                processes[idx].completion_time = current_time;
                processes[idx].turn_around_time = processes[idx].completion_time - processes[idx].arrival_time;
                processes[idx].waiting_time = processes[idx].turn_around_time - processes[idx].burst_time;
                completed++;
            }
        }

        return processes;
    }
};

using namespace emscripten;

EMSCRIPTEN_BINDINGS(scheduler_rr_module) {
    value_object<Process>("Process")
        .field("id", &Process::id)
        .field("burst_time", &Process::burst_time)
        .field("arrival_time", &Process::arrival_time)
        .field("remaining_time", &Process::remaining_time)
        .field("completion_time", &Process::completion_time)
        .field("waiting_time", &Process::waiting_time)
        .field("turn_around_time", &Process::turn_around_time);

    register_vector<Process>("vector<Process>");

    class_<Scheduler>("Scheduler")
        .constructor<>()
        .function("round_robin", &Scheduler::round_robin);
}
