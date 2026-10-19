$ErrorActionPreference = 'Stop'
$packPath = Join-Path $PSScriptRoot '../apps/web/private/library/traveller/beginners/Traveller_Beginner_test_www.frenglish.ru'
$outputPath = Join-Path $PSScriptRoot '../apps/web/private/books/traveller/exams'
$manifest = Get-Content (Join-Path $PSScriptRoot '../apps/web/src/content/traveller-exams.json') -Raw | ConvertFrom-Json
$wordApp = New-Object -ComObject Word.Application
$wordApp.Visible = $false
$wordApp.DisplayAlerts = 0
$wordApp.AutomationSecurity = 3
$originalLinksSetting = $wordApp.Options.UpdateLinksAtOpen
try {
 $wordApp.Options.UpdateLinksAtOpen = $false
 foreach ($exam in $manifest.exams) {
  $sourcePath = [IO.Path]::GetFullPath((Join-Path $packPath $exam.documentSource))
  $document = $wordApp.Documents.Open($sourcePath, $false, $true, $false)
  try {
   $text = $document.Content.Text.Replace([char]7, ' ').Replace("`r", "`n")
   [IO.File]::WriteAllText((Join-Path $outputPath ($exam.id + '-word.txt')), $text, [Text.UTF8Encoding]::new($false))
  } finally { $document.Close(0); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($document) }
 }
 $document = $wordApp.Documents.Open([IO.Path]::GetFullPath((Join-Path $packPath 'Traveller Beg_KEY TO TESTS.doc')), $false, $true, $false)
 try { [IO.File]::WriteAllText((Join-Path $outputPath 'teacher-key-word.txt'), $document.Content.Text.Replace([char]7, ' ').Replace("`r", "`n"), [Text.UTF8Encoding]::new($false)) }
 finally { $document.Close(0); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($document) }
 Write-Output 'Extracted text from 10 original Word tests and the teacher-key Word document. Macros and automatic link updates were disabled; originals were opened read-only.'
} finally {
 $wordApp.Options.UpdateLinksAtOpen = $originalLinksSetting
 $noSave = 0
 $wordApp.Quit([ref]$noSave)
 [void][Runtime.InteropServices.Marshal]::ReleaseComObject($wordApp)
}
