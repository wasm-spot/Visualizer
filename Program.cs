using System;
using System.Diagnostics;
using System.Text.Json;
using System.IO;
using Mono.Options;

namespace Visualizer
{
    class Program
    {
        static void Main(string[] args)
        {
            bool compare = false;
            bool sub = false;
            bool verbose = false;
            bool disable = false;
            string path = null;
            string inFileName = null;

            var optionsParser = new OptionSet() {
                { "c|compare", "compare linker input to output", v => { compare = v != null; } },
                { "d|dll=", "file path to assembly file", v => { path = v; } },
                { "s|substitution", "use linker-subs.xml", v => { sub = v != null; } },
                { "disable", "disable optimization", v => { disable = v != null; } },
                { "v|verbose=", "display all dependencies from the analyzer", v => { verbose = v != null; } },
            };

            if (args.Length == 0)
            {               
                System.Console.WriteLine("Please enter the file path to an assembly dll.");
            } else {
                optionsParser.Parse(args);
                if (path != null) {
                    char[] sep = {'/', '\\'};
                    var dll = path.Split(sep);
                    string name = dll[dll.Length-1];
                    string fileName = name.Substring(0, name.Length-4) + ".json";
                    
                    if (compare) {
                        inFileName = name.Substring(0, name.Length-4) + "-in.json";
                    }

                    var config = new Utf8JsonWriter(new FileStream("WebApp/wwwroot/json/config.json", FileMode.Create, FileAccess.Write, FileShare.Read));
                    using(config) {
                        config?.WriteStartObject();
                        config?.WriteString("data", fileName);
                        
                        if (compare) {
                            Console.WriteLine("writing in data");
                            config?.WriteString("inData", inFileName);
                        }

                        config?.WriteEndObject();
                    }

                    var process = new Process();
                    process.StartInfo.CreateNoWindow = true;
                    process.StartInfo.UseShellExecute = true;
                    process.StartInfo.FileName = "dotnet";

                    if (compare) {
                        Directory.Delete("nolink/", true);
                        process.StartInfo.Arguments = $"linker/artifacts/bin/Mono.Linker/Debug/netcoreapp3.0/illink.dll -c copy -a {path} -o nolink/ --dump-dependencies";
                        Console.WriteLine("Running linker....");
                        process.Start();
                        process.WaitForExit();
                
                        process.StartInfo.Arguments = $"linker/artifacts/bin/analyzer/Debug/netcoreapp3.0/illinkanalyzer.dll --alldeps --l nolink/ --outjson WebApp/wwwroot/json/ --json WebApp/wwwroot/json/{inFileName} nolink/linker-dependencies.xml.gz";
                        Console.WriteLine("Running linker analyzer...");
                        process.Start();
                        process.WaitForExit();
                    }
                    string command = $"linker/artifacts/bin/Mono.Linker/Debug/netcoreapp3.0/illink.dll -c link -a {path} --dump-dependencies";
                    if (sub) {
                        command += " --substitutions linker-subs.xml";
                    }

                    if (disable) {
                        command += " --disable-opt ipconstprop";
                    }

                    process.StartInfo.Arguments = command;
                    Directory.Delete("output/", true);
                    Console.WriteLine("Running linker....");
                    process.Start();
                    process.WaitForExit();
            
                    process.StartInfo.Arguments = $"linker/artifacts/bin/analyzer/Debug/netcoreapp3.0/illinkanalyzer.dll --alldeps --l output/ --outjson WebApp/wwwroot/json/ --json WebApp/wwwroot/json/{fileName} output/linker-dependencies.xml.gz";
                    Console.WriteLine("Running linker analyzer...");
                    process.Start();
                    process.WaitForExit();
            
                    process.StartInfo.Arguments = "run --project WebApp";
                    Console.WriteLine("Launching visualizer...");
                    process.Start();
                    process.WaitForExit();
                }
		        
		
            }

        }
    }
}
