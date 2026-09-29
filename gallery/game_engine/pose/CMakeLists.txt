cmake_minimum_required(VERSION 3.16)
project(ranger_pose CXX)

# Top-level build for BOTH the bench and the game from ONE TFLite compile — so you
# don't pay the ~1h TFLite/XNNPACK build twice. (native_bench/ and native_game/
# keep their own CMakeLists for standalone builds; prefer this one on the Pi.)
#
#   cmake -B build -DTENSORFLOW_SOURCE_DIR=~/tensorflow -DCMAKE_BUILD_TYPE=Release
#   cmake --build build -j"$(nproc)"     # -> build/pose_bench and build/pose_game

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release)
endif()
if(NOT DEFINED TENSORFLOW_SOURCE_DIR)
  message(FATAL_ERROR "Set -DTENSORFLOW_SOURCE_DIR=/path/to/tensorflow")
endif()

# TFLite once, shared by both targets.
add_subdirectory(
  "${TENSORFLOW_SOURCE_DIR}/tensorflow/lite"
  "${CMAKE_CURRENT_BINARY_DIR}/tensorflow-lite"
  EXCLUDE_FROM_ALL)

# --- bench (perf + accuracy probe, headless) ---
add_executable(pose_bench native_bench/pose_bench.cc)
target_link_libraries(pose_bench tensorflow-lite)

# --- game (live, needs SDL2 + a camera) ---
find_package(PkgConfig)
if(PkgConfig_FOUND)
  pkg_check_modules(SDL2 sdl2)
endif()
if(SDL2_FOUND)
  add_executable(pose_game
    native_game/pose_game.cc
    native_game/camera_v4l2.cc
    native_provider/rg_pose.cc)
  target_include_directories(pose_game PRIVATE ${SDL2_INCLUDE_DIRS})
  target_link_directories(pose_game PRIVATE ${SDL2_LIBRARY_DIRS})
  target_link_libraries(pose_game tensorflow-lite ${SDL2_LIBRARIES} pthread)
else()
  message(WARNING "SDL2 not found (apt install libsdl2-dev) — skipping pose_game; pose_bench still builds")
endif()

# ---------------------------------------------------------------------------
# wasm3 guest path: run the pose game as a real compiled wasm3 guest.
# ---------------------------------------------------------------------------
set(RUNTIME_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../runtime")
file(GLOB WASM3_SRC "${RUNTIME_DIR}/wasm3/m3_*.c")
add_library(rg_wasm3 STATIC ${WASM3_SRC} "${RUNTIME_DIR}/rg_wasm_bridge.c")
set_target_properties(rg_wasm3 PROPERTIES C_STANDARD 11)
target_include_directories(rg_wasm3 PUBLIC "${RUNTIME_DIR}" "${RUNTIME_DIR}/wasm3")
target_compile_options(rg_wasm3 PRIVATE -Wno-unused-parameter -Wno-unused-variable)

# headless proof (no camera / SDL / TFLite): fabricated pose -> wasm3 guest -> RGW1
add_executable(pose_wasm_smoke
  wasm_host/pose_wasm_smoke.cc
  native_provider/rg_pose.cc)
target_link_libraries(pose_wasm_smoke rg_wasm3 pthread)

# the live game as a wasm3 guest (camera + TFLite + SDL)
if(SDL2_FOUND)
  add_executable(pose_wasm_game
    wasm_host/pose_wasm_game.cc
    native_game/camera_v4l2.cc
    native_provider/rg_pose.cc)
  target_include_directories(pose_wasm_game PRIVATE ${SDL2_INCLUDE_DIRS})
  target_link_directories(pose_wasm_game PRIVATE ${SDL2_LIBRARY_DIRS})
  target_link_libraries(pose_wasm_game tensorflow-lite rg_wasm3 ${SDL2_LIBRARIES} pthread)
endif()
