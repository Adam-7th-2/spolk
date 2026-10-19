$ErrorActionPreference = 'Stop'
curl.exe -L --fail --connect-timeout 15 --max-time 1800 -o (Join-Path $PSScriptRoot '..\\.tools\\ffmpeg.zip') 'https://github.com/GyanD/codexffmpeg/releases/download/9.0.2/ffmpeg-9.0.2-full_build.zip'
