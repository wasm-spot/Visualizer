# SizeExplorer

A visualizer for il linker related data

# Directory:
web/: files for plotting JSON with d3.js

WebApp/: WebApp created using WebAssembly and d3.js to plot wasm linker performance

# To run web app:
In the WebApp/ folder, run:

`dotnet run`

Go to localhost:5001

Data is in the `WebApp/wwwroot/json/` directory, and should be a json of the format:

```
[
    {
        "name": assembly name,
        "size": #,
        "sections": [
            {
                "name": class name,
                "size": #,
                "sections": [
                    {
                        "name": method name,
                        "size": #,
                        "sections": null
                        ...
```
