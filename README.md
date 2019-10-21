# SizeExplorer

A visualizer for il linker related data

# Directory:
web/: files for plotting JSON with d3.js

WebApp/: WebApp created using WebAssembly and d3.js to plot wasm linker performance

# To run web app:
In the WebApp/ folder, run:

`dotnet run`

Go to localhost:5001

# To view sunburst visualization:
In the web/ folder, run:

`python -m http.server`

Go to localhost:8000/sunburst.html
