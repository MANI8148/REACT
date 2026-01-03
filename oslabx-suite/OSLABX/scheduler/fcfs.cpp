#include <iostream>
#include <vector>
#include <algorithm>
#include <emscripten/bind.h>

struct Process {
    int id;
    int burst_time;
    int arrival_time;
    int remaining_time;
    int completion_time;
};

class Scheduler {
public:
    std::vector<Process> fcfs(std::vector<Process> processes) {
        std::sort(processes.begin(), processes.end(), [](const Process& a, const Process& b) {
            return a.arrival_time < b.arrival_time;
        });

        int current_time = 0;
        for (auto& p : processes) {
            if (current_time < p.arrival_time) {
                current_time = p.arrival_time;
            }
            current_time += p.burst_time;
            p.completion_time = current_time;
        }
        return processes;
    }
};

using namespace emscripten;

EMSCRIPTEN_BINDINGS(scheduler_module) {
    value_object<Process>("Process")
        .field("id", &Process::id)
        .field("burst_time", &Process::burst_time)
        .field("arrival_time", &Process::arrival_time)
        .field("remaining_time", &Process::remaining_time)
        .field("completion_time", &Process::completion_time);

    register_vector<Process>("vector<Process>");

    class_<Scheduler>("Scheduler")
        .constructor<>()
        .function("fcfs", &Scheduler::fcfs);
}
