# SizeExplorer

A visualizer for il linker related data

# To launch local instance of Visualizer:
Run `sh ./run.sh`

# Directory Structure:
```
WebApp/: WebApp created using WebAssembly and d3.js to plot wasm linker performance

tools/:
    | web/: files for plotting JSON with d3.js
    | pyscripts/: preliminary python scripts for data exploration
```

# To run web app separately:
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
