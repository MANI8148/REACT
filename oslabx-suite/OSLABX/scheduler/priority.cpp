#include <iostream>
#include <vector>
#include <algorithm>
#include <climits>
#include <emscripten/bind.h>

struct Process {
    int id;
    int burst_time;
    int arrival_time;
    int priority; // Lower value = Higher priority (convention)
    int remaining_time;
    int completion_time;
    int waiting_time;
    int turn_around_time;
};

class Scheduler {
public:
    std::vector<Process> priority_scheduling(std::vector<Process> processes) {
        int n = processes.size();
        std::vector<bool> completed(n, false);
        int current_time = 0;
        int completed_count = 0;

        // Non-preemptive Priority Scheduling
        while (completed_count < n) {
            int idx = -1;
            int highest_priority = INT_MAX; // Lower value means higher priority

            for (int i = 0; i < n; ++i) {
                if (!completed[i] && processes[i].arrival_time <= current_time) {
                    if (processes[i].priority < highest_priority) {
                        highest_priority = processes[i].priority;
                        idx = i;
                    }
                    else if (processes[i].priority == highest_priority) {
                        // FCFS tie-breaking
                        if (processes[i].arrival_time < processes[idx].arrival_time) {
                            idx = i;
                        }
                    }
                }
            }

            if (idx != -1) {
                current_time += processes[idx].burst_time;
                processes[idx].completion_time = current_time;
                processes[idx].turn_around_time = processes[idx].completion_time - processes[idx].arrival_time;
                processes[idx].waiting_time = processes[idx].turn_around_time - processes[idx].burst_time;
                completed[idx] = true;
                completed_count++;
            } else {
                int next_arrival = INT_MAX;
                for (int i = 0; i < n; ++i) {
                    if (!completed[i] && processes[i].arrival_time < next_arrival) {
                        next_arrival = processes[i].arrival_time;
                    }
                }
                 if (next_arrival == INT_MAX) break;
                current_time = next_arrival;
            }
        }
        return processes;
    }
};

using namespace emscripten;

EMSCRIPTEN_BINDINGS(scheduler_priority_module) {
    value_object<Process>("Process")
        .field("id", &Process::id)
        .field("burst_time", &Process::burst_time)
        .field("arrival_time", &Process::arrival_time)
        .field("priority", &Process::priority)
        .field("remaining_time", &Process::remaining_time)
        .field("completion_time", &Process::completion_time)
        .field("waiting_time", &Process::waiting_time)
        .field("turn_around_time", &Process::turn_around_time);

    register_vector<Process>("vector<Process>");

    class_<Scheduler>("Scheduler")
        .constructor<>()
        .function("priority_scheduling", &Scheduler::priority_scheduling);
}
