cmake_minimum_required(VERSION 3.16)
project(pose_bench CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release)
endif()

# TFLite is pulled in via its own CMake from a tensorflow source checkout:
#   git clone --depth 1 https://github.com/tensorflow/tensorflow ~/tensorflow
#   cmake -B build -DTENSORFLOW_SOURCE_DIR=~/tensorflow
# XNNPACK (the fast multi-threaded ARM CPU path) is enabled by the tflite build
# by default, so no extra wiring is needed.
if(NOT DEFINED TENSORFLOW_SOURCE_DIR)
  message(FATAL_ERROR
    "Set -DTENSORFLOW_SOURCE_DIR=/path/to/tensorflow "
    "(git clone --depth 1 https://github.com/tensorflow/tensorflow)")
endif()

add_subdirectory(
  "${TENSORFLOW_SOURCE_DIR}/tensorflow/lite"
  "${CMAKE_CURRENT_BINARY_DIR}/tensorflow-lite"
  EXCLUDE_FROM_ALL)

add_executable(pose_bench pose_bench.cc)
target_link_libraries(pose_bench tensorflow-lite)
