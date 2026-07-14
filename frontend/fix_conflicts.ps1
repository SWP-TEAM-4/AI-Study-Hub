# Robust merge conflict resolver - handles nested 3-way conflicts
# Strategy: iteratively resolve innermost conflicts keeping HEAD version

param(
    [string]$SourceDir = "src"
)

function Resolve-ConflictMarkers {
    param([string]$content)
    
    # Keep applying regex until no conflicts remain
    $maxPasses = 10
    $pass = 0
    
    while ($pass -lt $maxPasses) {
        # Match innermost conflict block (no nested <<< inside HEAD part)
        # Pattern: <<<<<<< anything\n(content without <<<)\n=======\n(any content)\n>>>>>>> anything
        $pattern = '(?m)^<<<<<<< [^\n]*\n((?:(?!^<<<<<<<|^=======|^>>>>>>>)[^\n]*\n)*?)^=======\n(?:(?!^<<<<<<<|^=======|^>>>>>>>)[^\n]*\n)*?^>>>>>>> [^\n]*\n?'
        
        $newContent = [regex]::Replace($content, $pattern, '$1')
        
        if ($newContent -eq $content) {
            break  # No more changes, done
        }
        $content = $newContent
        $pass++
    }
    
    return $content
}

# Find all TS/TSX files with conflict markers
$allFiles = Get-ChildItem -Path $SourceDir -Recurse -Include "*.ts","*.tsx" |
    Where-Object { Select-String -Path $_.FullName -Pattern "^<<<<<<< " -Quiet }

Write-Host "Found $($allFiles.Count) files with merge conflicts"
Write-Host ""

foreach ($file in $allFiles) {
    Write-Host "Fixing: $($file.FullName.Replace((Get-Location).Path + '\', ''))"
    
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.UTF8Encoding]::new($false))
    $fixed = Resolve-ConflictMarkers $content
    
    # Check if still has conflicts
    $remaining = [regex]::Matches($fixed, '^<<<<<<< ', [System.Text.RegularExpressions.RegexOptions]::Multiline).Count
    
    [System.IO.File]::WriteAllText($file.FullName, $fixed, [System.Text.UTF8Encoding]::new($false))
    
    if ($remaining -gt 0) {
        Write-Host "  WARNING: $remaining conflict block(s) still remain - may need manual fix"
    } else {
        Write-Host "  OK: All conflicts resolved"
    }
}

Write-Host ""
Write-Host "=== VERIFICATION ==="
$stillConflicted = Get-ChildItem -Path $SourceDir -Recurse -Include "*.ts","*.tsx" |
    Where-Object { Select-String -Path $_.FullName -Pattern "^<<<<<<< " -Quiet }

if ($stillConflicted.Count -eq 0) {
    Write-Host "SUCCESS: Zero conflict markers remain across all files!"
} else {
    Write-Host "Still conflicted files:"
    $stillConflicted | ForEach-Object { Write-Host "  - $($_.Name)" }
}
