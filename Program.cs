using System;
using System.Diagnostics;
using System.Text.Json;
using System.IO;


namespace Visualizer
{
    class Program
    {
        static void Main(string[] args)
        {
            if (args.Length == 0)
            {               
                System.Console.WriteLine("Please enter the file path to an assembly dll.");
            } else {
		char[] sep = {'/', '\\'};
                var dll = args[0].Split(sep);
                string fileName = dll[dll.Length-1];
                fileName = fileName.Substring(0, fileName.Length-4) + ".json";
		Console.WriteLine(fileName);

                var config = new Utf8JsonWriter(new FileStream("WebApp/wwwroot/json/config.json", FileMode.Create, FileAccess.Write, FileShare.Read));
                using(config) {
                    config?.WriteStartObject();
                    config?.WriteString("data", fileName);
                    config?.WriteEndObject();
                }

                var process = new Process();
                process.StartInfo.CreateNoWindow = true;
                process.StartInfo.UseShellExecute = true;
                process.StartInfo.FileName = "dotnet";

                process.StartInfo.Arguments = $"linker/src/linker/bin/illink_Debug/netcoreapp2.0/illink.dll -c link -a {args[0]} --dump-dependencies";
                Console.WriteLine("Running linker....");
                process.Start();
                process.WaitForExit();
		
                process.StartInfo.Arguments = $"linker/src/analyzer/bin/illink_Debug/netcoreapp3.0/illinkanalyzer.dll --alldeps --l output/ --outjson WebApp/wwwroot/json/ --json WebApp/wwwroot/json/{fileName} output/linker-dependencies.xml.gz";
                Console.WriteLine("Running linker analyzer...");
                process.Start();
                process.WaitForExit();
		
                process.StartInfo.Arguments = "run --project WebApp --urls http://localhost:5050";
                Console.WriteLine("Launching visualizer...");
                process.Start();
                process.WaitForExit();
		
            }

        }
    }
}
