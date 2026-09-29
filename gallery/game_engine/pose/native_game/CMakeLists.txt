cmake_minimum_required(VERSION 3.16)
project(pose_game CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release)
endif()

# TFLite from a tensorflow source checkout (same as ../native_bench). XNNPACK on
# by default. Point at it: -DTENSORFLOW_SOURCE_DIR=~/tensorflow
if(NOT DEFINED TENSORFLOW_SOURCE_DIR)
  message(FATAL_ERROR "Set -DTENSORFLOW_SOURCE_DIR=/path/to/tensorflow")
endif()
add_subdirectory(
  "${TENSORFLOW_SOURCE_DIR}/tensorflow/lite"
  "${CMAKE_CURRENT_BINARY_DIR}/tensorflow-lite"
  EXCLUDE_FROM_ALL)

find_package(PkgConfig REQUIRED)
pkg_check_modules(SDL2 REQUIRED sdl2)

add_executable(pose_game
  pose_game.cc
  camera_v4l2.cc
  "${CMAKE_CURRENT_SOURCE_DIR}/../native_provider/rg_pose.cc")

target_include_directories(pose_game PRIVATE ${SDL2_INCLUDE_DIRS})
target_link_directories(pose_game PRIVATE ${SDL2_LIBRARY_DIRS})
target_link_libraries(pose_game tensorflow-lite ${SDL2_LIBRARIES} pthread)
