#!/bin/bash
echo running linker...
monolinker -a $1 -c link --dump-dependencies -out ./out/

echo running linker analyzer...
[ ! -d "WebApp/wwwroot/json/$2" ] && dotnet run --project linker/src/analyzer --framework netcoreapp3.0 -c illink_Debug --l out/ --json WebApp/wwwroot/json/$2 out/linker-dependencies.xml.gz

echo loading visualizer...
(sleep 4s ; open https://localhost:5001) &
dotnet run --project WebApp
