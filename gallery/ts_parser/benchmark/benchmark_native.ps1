# Benchmark: TypeScript Parser Cross-Language Comparison
# Compares parsing performance of Rust, C++, Go, and Node.js builds

param(
    [int]$Iterations = 100
)

$SmallFile = "gallery\ts_parser\benchmark\samples\small.ts"
$LargeFile = "gallery\ts_parser\benchmark\samples\large.ts"

$RustExe = ".\gallery\ts_parser\bin\ts_parser_rust.exe"
$CppExe = ".\gallery\ts_parser\bin\ts_parser_cpp.exe"
$GoExe = ".\gallery\ts_parser\bin\ts_parser_go.exe"
$NodeJs = ".\gallery\ts_parser\bin\ts_parser_main.js"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TypeScript Parser Cross-Language Benchmark" -ForegroundColor Cyan
Write-Host "  Rust vs C++ vs Go vs Node.js" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Iterations per test: $Iterations"
Write-Host ""

# Check which executables exist
$hasRust = Test-Path $RustExe
$hasCpp = Test-Path $CppExe
$hasGo = Test-Path $GoExe
$hasNode = Test-Path $NodeJs

if (-not $hasRust) { Write-Host "Warning: Rust executable not found at $RustExe" -ForegroundColor Red }
if (-not $hasCpp) { Write-Host "Warning: C++ executable not found at $CppExe" -ForegroundColor Red }
if (-not $hasGo) { Write-Host "Warning: Go executable not found at $GoExe" -ForegroundColor Red }
if (-not $hasNode) { Write-Host "Warning: Node.js script not found at $NodeJs" -ForegroundColor Red }

# Warm up
Write-Host "Warming up..." -ForegroundColor Yellow
if ($hasRust) { & $RustExe -i $SmallFile --show-interfaces 2>$null | Out-Null }
if ($hasCpp) { & $CppExe -i $SmallFile --show-interfaces 2>$null | Out-Null }
if ($hasGo) { & $GoExe -i $SmallFile --show-interfaces 2>$null | Out-Null }
if ($hasNode) { & node $NodeJs -i $SmallFile --show-interfaces 2>$null | Out-Null }
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
        & $Command 2>$null | Out-Null
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

function Show-Results {
    param(
        [array]$Results,
        [string]$FileType
    )
    
    Write-Host ""
    Write-Host "Results ($FileType):" -ForegroundColor Cyan
    
    # Sort by average time
    $sorted = $Results | Sort-Object { $_.Avg }
    $fastest = $sorted[0].Avg
    
    foreach ($r in $sorted) {
        $ratio = $r.Avg / $fastest
        $ratioStr = if ($ratio -eq 1) { "(fastest)" } else { ("{0:F2}x slower" -f $ratio) }
        Write-Host ("  {0,-6} avg={1,7:F3}ms  min={2,7:F3}ms  max={3,7:F3}ms  {4}" -f ($r.Name + ":"), $r.Avg, $r.Min, $r.Max, $ratioStr)
    }
    
    Write-Host ""
    Write-Host ("  Winner: {0}" -f $sorted[0].Name) -ForegroundColor Green
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Small File: $SmallFile" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$smallResults = @()

if ($hasRust) {
    Write-Host "Testing Rust..." -ForegroundColor Yellow
    $smallResults += Measure-Parser -Name "Rust" -Command { & $RustExe -i $SmallFile --show-interfaces } -Iterations $Iterations
}

if ($hasCpp) {
    Write-Host "Testing C++..." -ForegroundColor Yellow
    $smallResults += Measure-Parser -Name "C++" -Command { & $CppExe -i $SmallFile --show-interfaces } -Iterations $Iterations
}

if ($hasGo) {
    Write-Host "Testing Go..." -ForegroundColor Yellow
    $smallResults += Measure-Parser -Name "Go" -Command { & $GoExe -i $SmallFile --show-interfaces } -Iterations $Iterations
}

if ($hasNode) {
    Write-Host "Testing Node.js..." -ForegroundColor Yellow
    $smallResults += Measure-Parser -Name "Node" -Command { & node $NodeJs -i $SmallFile --show-interfaces } -Iterations $Iterations
}

Show-Results -Results $smallResults -FileType "Small File"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Large File: $LargeFile" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$largeResults = @()

if ($hasRust) {
    Write-Host "Testing Rust..." -ForegroundColor Yellow
    $largeResults += Measure-Parser -Name "Rust" -Command { & $RustExe -i $LargeFile --show-interfaces } -Iterations $Iterations
}

if ($hasCpp) {
    Write-Host "Testing C++..." -ForegroundColor Yellow
    $largeResults += Measure-Parser -Name "C++" -Command { & $CppExe -i $LargeFile --show-interfaces } -Iterations $Iterations
}

if ($hasGo) {
    Write-Host "Testing Go..." -ForegroundColor Yellow
    $largeResults += Measure-Parser -Name "Go" -Command { & $GoExe -i $LargeFile --show-interfaces } -Iterations $Iterations
}

if ($hasNode) {
    Write-Host "Testing Node.js..." -ForegroundColor Yellow
    $largeResults += Measure-Parser -Name "Node" -Command { & node $NodeJs -i $LargeFile --show-interfaces } -Iterations $Iterations
}

Show-Results -Results $largeResults -FileType "Large File"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Compilers/Runtimes:" -ForegroundColor Green
Write-Host "Rust:    compiled with rustc -O" -ForegroundColor Yellow
Write-Host "C++:     cross-compiled with x86_64-w64-mingw32-g++-posix -O3" -ForegroundColor Yellow
Write-Host "Go:      compiled with go build" -ForegroundColor Yellow
Write-Host "Node.js: interpreted via Node.js runtime" -ForegroundColor Yellow
