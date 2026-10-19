# Offline OCR using the English recognizer already installed in Windows.
# Reads only the supplied student book and writes a private page text index.
param([int]$Limit=126)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null=[Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
$null=[Windows.Storage.Streams.IRandomAccessStream,Windows.Storage.Streams,ContentType=WindowsRuntime]
$null=[Windows.Graphics.Imaging.BitmapDecoder,Windows.Graphics.Imaging,ContentType=WindowsRuntime]
$null=[Windows.Graphics.Imaging.SoftwareBitmap,Windows.Graphics.Imaging,ContentType=WindowsRuntime]
$null=[Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]
$null=[Windows.Media.Ocr.OcrResult,Windows.Foundation,ContentType=WindowsRuntime]
$null=[Windows.Globalization.Language,Windows.Globalization,ContentType=WindowsRuntime]
$asTask=[System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
function Await-WinRT($Operation,[Type]$ResultType){$task=$asTask.MakeGenericMethod($ResultType).Invoke($null,@($Operation));$task.GetAwaiter().GetResult()}
$root=if($PSScriptRoot){Split-Path -Parent $PSScriptRoot}else{(Get-Location).Path}
$base=Join-Path $root 'apps/web/private/books/traveller'
$expected='4a8aaabad1c8f7a357d252fd1c6c834c5fcf877f9c56cd4f66dfde46a7fed20e'
if((Get-FileHash -LiteralPath (Join-Path $base 'source.pdf') -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected){throw 'Student book fingerprint changed; review source before indexing.'}
$pages=@{}
$output=Join-Path $base 'page-text.json'
if(Test-Path -LiteralPath $output){$old=Get-Content -LiteralPath $output -Raw -Encoding UTF8 | ConvertFrom-Json;if($old.sourceSha256 -ne $expected){throw 'Index source mismatch'};foreach($property in $old.pages.PSObject.Properties){$pages[$property.Name]=$property.Value}}
$engine=[Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('en-US'))
if(-not $engine){throw 'The Windows English OCR recognizer is unavailable.'}
for($page=1;$page -le [Math]::Min(126,$Limit);$page++){
 if($pages.ContainsKey([string]$page)){continue}
 $image=Join-Path $base ('pages/{0:000}.jpg' -f $page)
 $file=Await-WinRT ([Windows.Storage.StorageFile]::GetFileFromPathAsync($image)) ([Windows.Storage.StorageFile])
 $stream=Await-WinRT ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
 try{
  $decoder=Await-WinRT ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bitmap=Await-WinRT ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  try{$result=Await-WinRT ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult]);$pages[[string]$page]=($result.Lines | ForEach-Object {$_.Text}) -join "`n"}finally{$bitmap.Dispose()}
 }finally{$stream.Dispose()}
 $data=@{sourceSha256=$expected;method='Windows English OCR; verify quotations against original page';pages=$pages}|ConvertTo-Json -Depth 5
 [IO.File]::WriteAllText($output,$data,[Text.UTF8Encoding]::new($false))
 if($page % 10 -eq 0 -or $page -eq $Limit){Write-Output "Indexed student book page $page/126"}
}
