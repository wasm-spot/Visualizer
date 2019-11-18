#!/bin/bash

rm -rf out/
dotnet publish -c Release -o out --self-contained true
mv _content out/WebApp/dist/
cd out/
mv _framework WebApp/dist/

cd WebApp/dist
az storage blob upload-batch --account-name visualizer -s . -d \$web

az storage blob update --account-name visualizer -c \$web -n _framework/wasm/mono.wasm --content-type application/wasm
