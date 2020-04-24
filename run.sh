#!/bin/bash
echo running linker...
monolinker -a $1 -c link --dump-dependencies -out ./out/

IFS='/' read -ra array <<< "$1"
file=${array[${#array[@]}-1]}

path="${file:0:${#file}-4}.json"

echo running linker analyzer...
echo Saving linker analyzer output to WebApp/wwwroot/json/$path
[ ! -d "WebApp/wwwroot/json/$path" ] && dotnet run --project linker/src/analyzer --framework netcoreapp3.0 --alldeps -c illink_Debug --l out/ --outjson WebApp/wwwroot/json/ --json WebApp/wwwroot/json/$path out/linker-dependencies.xml.gz

echo {\"data\": \"$path\" }  > WebApp/wwwroot/json/config.json 

echo loading visualizer...
(sleep 4s ; open https://localhost:5001) &
dotnet run --project WebApp
