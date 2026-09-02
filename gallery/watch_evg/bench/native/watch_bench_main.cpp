// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The same three watch screens, as ahead-of-time compiled native code.
//
// Why this file exists: **watchOS**. A Wear OS port of EVG is Kotlin and can be
// measured on a JVM (`scripts/run-jvm.sh`); an Apple Watch port would be
// Ranger's Swift target, and there is no Swift toolchain in this repository's
// CI to measure it with. So this stands in for it.
//
// It is a better stand-in than a JVM number scaled by a guess, and the reason
// is `std::shared_ptr`. Ranger's C++ target reference-counts every object, so
// building an 82-element tree here pays an atomic increment per edge — which is
// exactly the tax Swift's ARC charges a Swift port for the same tree, and
// exactly the tax a tracing collector does *not* charge the JVM. Native, AOT,
// refcounted, no warm-up: that is the shape of the runtime an Apple Watch would
// run, whatever the last-mile differences between `shared_ptr` and ARC.
//
// What it is still not: an Apple Watch. It is x86-64 on a server. The CPU
// scaling is `calibrate`'s job, not this file's.
//
//   bash gallery/watch_evg/bench/scripts/run-native.sh

#include "watch_bench.cpp"

#include <chrono>
#include <cstdio>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <functional>

using Clock = std::chrono::steady_clock;

static const int WARM = 300;
static const int RUNS = 51;

static double timeIt(const std::function<void()>& fn, int warm = WARM, int runs = RUNS) {
    for (int i = 0; i < warm; i++) fn();
    std::vector<double> t;
    t.reserve(runs);
    for (int i = 0; i < runs; i++) {
        auto a = Clock::now();
        fn();
        t.push_back(std::chrono::duration<double, std::milli>(Clock::now() - a).count());
    }
    std::sort(t.begin(), t.end());
    return t[runs / 2];
}

struct Scene { const char* name; int kind; int n; int v; };

static const Scene SCENES[3] = {
    { "face", 0, 60, 7 },
    { "list", 1, 12, 2 },
    { "workout", 2, 0, 148 },
};

int main(int argc, char** argv) {
    std::string root = argc > 1 ? argv[1] : ".";
    std::ifstream in(root + "/gallery/watch_evg/bench/watch.css");
    if (!in) {
        std::fprintf(stderr, "watch.css not found under %s — pass the repository root\n", root.c_str());
        return 3;
    }
    std::stringstream ss;
    ss << in.rdbuf();
    const std::string css = ss.str();

    // The cold pass first and once, before anything is touched twice. There is
    // no JIT here, so this measures allocation and cache misses rather than
    // interpretation — which is the point: it is the number a native port would
    // actually see on its first frame.
    double cold[3];
    for (int i = 0; i < 3; i++) {
        const Scene& s = SCENES[i];
        auto a = Clock::now();
        auto sh = WatchBench::sheetFor(css);
        auto tree = WatchBench::scene(s.kind, s.n, s.v);
        WatchBench::styleOnly(sh, tree);
        auto lay = WatchBench::layoutOnly(tree);
        WatchBench::listOnly(tree, lay);
        cold[i] = std::chrono::duration<double, std::milli>(Clock::now() - a).count();
    }

    double cssParse = timeIt([&] { WatchBench::sheetFor(css); }, 20, 21);
    // Consumed through a volatile: -O2 will delete the whole loop otherwise,
    // and a calibration that reads 0.0 ms scales every other number to nothing.
    static volatile double calSink = 0.0;
    double cal = timeIt([&] { calSink = WatchBench::calibrate(2000000); }, 3, 9);

    std::printf("\n=== EVG on a 454x454 watch panel — ms per frame, C++ (AOT, shared_ptr) ===\n");
    std::printf("    (median of %d after %d warm-up runs; calibrate(2e6) = %.1f ms, stylesheet parse %.2f ms)\n\n",
                RUNS, WARM, cal, cssParse);
    std::printf("  scene    elems  cmds |   build   style  layout    list |    tick  scroll retained rebuild |    cold\n");
    std::printf("  -------  -----  ---- | ------- ------- ------- ------- | ------- ------- -------- ------- | -------\n");

    for (int pass = 0; pass < 2; pass++) {
        for (int i = 0; i < 3; i++) {
            const Scene& s = SCENES[i];

            double build = timeIt([&] { WatchBench::scene(s.kind, s.n, s.v); });

            auto s1 = WatchBench::sheetFor(css);
            auto styleTree = WatchBench::scene(s.kind, s.n, s.v);
            double style = timeIt([&] { WatchBench::styleOnly(s1, styleTree); });

            auto s2 = WatchBench::sheetFor(css);
            auto layTree = WatchBench::scene(s.kind, s.n, s.v);
            WatchBench::styleOnly(s2, layTree);
            double layout = timeIt([&] { WatchBench::layoutOnly(layTree); });

            auto s3 = WatchBench::sheetFor(css);
            auto dlTree = WatchBench::scene(s.kind, s.n, s.v);
            WatchBench::styleOnly(s3, dlTree);
            auto dlLay = WatchBench::layoutOnly(dlTree);
            double list = timeIt([&] { WatchBench::listOnly(dlTree, dlLay); });

            auto sR = WatchBench::sheetFor(css);
            double rebuild = timeIt([&] {
                auto tree = WatchBench::scene(s.kind, s.n, s.v);
                WatchBench::styleOnly(sR, tree);
                auto lay = WatchBench::layoutOnly(tree);
                WatchBench::listOnly(tree, lay);
            });

            auto s4 = WatchBench::sheetFor(css);
            auto live = WatchBench::scene(s.kind, s.n, s.v);
            double retained = timeIt([&] {
                WatchBench::styleOnly(s4, live);
                auto lay = WatchBench::layoutOnly(live);
                WatchBench::listOnly(live, lay);
            });

            auto s5 = WatchBench::sheetFor(css);
            auto tickTree = WatchBench::scene(s.kind, s.n, s.v);
            WatchBench::styleOnly(s5, tickTree);
            auto tickLay = WatchBench::layoutOnly(tickTree);
            WatchBench::listOnly(tickTree, tickLay);
            int sec = 0;
            double tick = timeIt([&] {
                sec = (sec + 1) % 60;
                WatchBench::setClock(tickTree, sec);
                WatchBench::styleOnly(s5, tickTree);
                if (!WatchBench::layoutClean(s5)) tickLay = WatchBench::layoutOnly(tickTree);
                WatchBench::listOnly(tickTree, tickLay);
            });

            auto s6 = WatchBench::sheetFor(css);
            auto scrollTree = WatchBench::scene(s.kind, s.n, s.v);
            WatchBench::styleOnly(s6, scrollTree);
            double off = 0.0;
            double scroll = timeIt([&] {
                off = off > 240.0 ? 0.0 : off + 3.0;
                WatchBench::setScroll(scrollTree, off);
                auto lay = WatchBench::layoutOnly(scrollTree);
                WatchBench::listOnly(scrollTree, lay);
            });

            // The first pass is thrown away: the phases are tens of
            // microseconds and the allocator's free lists are not the same
            // shape at the start of a process as they are once it is running.
            if (pass == 0) continue;

            std::printf("  %-7s  %5d  %4d | %7.3f %7.3f %7.3f %7.3f | %7.3f %7.3f %8.3f %7.3f | %7.3f\n",
                        s.name, WatchBench::countElements(dlTree), WatchBench::listOnly(dlTree, dlLay),
                        build, style, layout, list, tick, scroll, retained, rebuild, cold[i]);
        }
    }

    std::printf("\n  No `paint` column: there is no CPU rasteriser on this target. The display\n");
    std::printf("  list is built and then dropped, which is the whole of what EVG owns.\n");
    return 0;
}
