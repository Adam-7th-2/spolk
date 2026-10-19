$ErrorActionPreference='Stop'
$archive=Join-Path $PSScriptRoot '..\\.tools\\ffmpeg.zip';$extract=Join-Path $PSScriptRoot '..\\.tools\\ffmpeg2'
if(!(Test-Path $archive)){throw 'FFmpeg archive is missing.'}
if(!(Test-Path (Join-Path $extract 'ffmpeg.exe'))){Expand-Archive -LiteralPath $archive -DestinationPath $extract -Force}
$ffmpeg=Get-ChildItem -LiteralPath $extract -Recurse -Filter ffmpeg.exe | Select-Object -First 1
if(!$ffmpeg){throw 'ffmpeg.exe was not found.'}
$source=(Resolve-Path (Join-Path $PSScriptRoot '..\\apps\\web\\private\\library\\traveller\\beginners\\Music\\Traveller_Beginner_Audio_www.frenglish.ru')).Path
$target=(Join-Path $PSScriptRoot '..\\apps\\web\\private\\library\\traveller\\beginners\\Music\\mp3')
Get-ChildItem -LiteralPath $source -Recurse -Filter '*.wma' | ForEach-Object {
 $relative=$_.FullName.Substring($source.Length).TrimStart('\\');$out=Join-Path $target ([IO.Path]::ChangeExtension($relative,'.mp3'));$dir=Split-Path $out
 New-Item -ItemType Directory -Force -Path $dir | Out-Null
 & $ffmpeg.FullName -y -loglevel error -i $_.FullName -vn -codec:a libmp3lame -q:a 3 $out
}
