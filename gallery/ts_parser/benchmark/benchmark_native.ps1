# Benchmark: Rust vs C++ TypeScript Parser
# Compares parsing performance of native builds

param(
    [int]$Iterations = 100
)

$SmallFile = "gallery\ts_parser\benchmark\samples\small.ts"
$LargeFile = "gallery\ts_parser\benchmark\samples\large.ts"

$RustExe = ".\gallery\ts_parser\bin\ts_parser_rust.exe"
$CppExe = ".\gallery\ts_parser\bin\ts_parser_cpp.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Rust vs C++ TypeScript Parser Benchmark" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Iterations per test: $Iterations"
Write-Host ""

# Warm up
Write-Host "Warming up..." -ForegroundColor Yellow
& $RustExe -i $SmallFile --show-interfaces | Out-Null
& $CppExe -i $SmallFile --show-interfaces | Out-Null
Write-Host ""

# Function to benchmark
function Measure-Parser {
    param(
        [string]$Name,
        [scriptblock]$Command,
        [int]$Iterations
    )
    
    $times = @()
    for ($i = 0; $i -lt $Iterations; $i++) {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        & $Command | Out-Null
        $sw.Stop()
        $times += $sw.Elapsed.TotalMilliseconds
    }
    
    $avg = ($times | Measure-Object -Average).Average
    $min = ($times | Measure-Object -Minimum).Minimum
    $max = ($times | Measure-Object -Maximum).Maximum
    
    return @{
        Name = $Name
        Avg = $avg
        Min = $min
        Max = $max
    }
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Small File: $SmallFile" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Testing Rust..." -ForegroundColor Yellow
$rustSmall = Measure-Parser -Name "Rust" -Command { & $RustExe -i $SmallFile --show-interfaces } -Iterations $Iterations

Write-Host "Testing C++..." -ForegroundColor Yellow
$cppSmall = Measure-Parser -Name "C++" -Command { & $CppExe -i $SmallFile --show-interfaces } -Iterations $Iterations

Write-Host ""
Write-Host "Results (Small File):" -ForegroundColor Cyan
Write-Host ("  Rust:  avg={0:F3}ms  min={1:F3}ms  max={2:F3}ms" -f $rustSmall.Avg, $rustSmall.Min, $rustSmall.Max)
Write-Host ("  C++:   avg={0:F3}ms  min={1:F3}ms  max={2:F3}ms" -f $cppSmall.Avg, $cppSmall.Min, $cppSmall.Max)

$ratioSmall = $cppSmall.Avg / $rustSmall.Avg
if ($ratioSmall -gt 1) {
    Write-Host ("  Winner: Rust is {0:F2}x faster" -f $ratioSmall) -ForegroundColor Green
} else {
    Write-Host ("  Winner: C++ is {0:F2}x faster" -f (1/$ratioSmall)) -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Large File: $LargeFile" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Testing Rust..." -ForegroundColor Yellow
$rustLarge = Measure-Parser -Name "Rust" -Command { & $RustExe -i $LargeFile --show-interfaces } -Iterations $Iterations

Write-Host "Testing C++..." -ForegroundColor Yellow
$cppLarge = Measure-Parser -Name "C++" -Command { & $CppExe -i $LargeFile --show-interfaces } -Iterations $Iterations

Write-Host ""
Write-Host "Results (Large File):" -ForegroundColor Cyan
Write-Host ("  Rust:  avg={0:F3}ms  min={1:F3}ms  max={2:F3}ms" -f $rustLarge.Avg, $rustLarge.Min, $rustLarge.Max)
Write-Host ("  C++:   avg={0:F3}ms  min={1:F3}ms  max={2:F3}ms" -f $cppLarge.Avg, $cppLarge.Min, $cppLarge.Max)

$ratioLarge = $cppLarge.Avg / $rustLarge.Avg
if ($ratioLarge -gt 1) {
    Write-Host ("  Winner: Rust is {0:F2}x faster" -f $ratioLarge) -ForegroundColor Green
} else {
    Write-Host ("  Winner: C++ is {0:F2}x faster" -f (1/$ratioLarge)) -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Both executables are native Windows binaries." -ForegroundColor Green
Write-Host "Rust: compiled with rustc -O" -ForegroundColor Yellow
Write-Host "C++:  cross-compiled with x86_64-w64-mingw32-g++-posix -O3" -ForegroundColor Yellow
