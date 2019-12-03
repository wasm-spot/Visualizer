#!/bin/bash
echo running linker...
[ ! -d "out/" ] && monolinker -a $1 -c link --dump-dependencies -out ./out/

echo running linker analyzer...
[ ! -d "WebApp/wwwroot/json/" ] && dotnet run --project linker/src/analyzer --framework netcoreapp3.0 -c illink_Debug --l out/ --json WebApp/wwwroot/json/data.json out/linker-dependencies.xml.gz

echo loading visualizer...
(sleep 4s ; open https://localhost:5001) &
dotnet run --project WebApp
