using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using System.Data;
using System.IO;
using System.Linq;
using CsvHelper;
using CsvHelper.Configuration.Attributes;
using Newtonsoft.Json;
using System.Diagnostics;

namespace History {
    
    public class Info
    {
        public Dictionary<string, object> Library { get; set; }
    }

    public class Commit {
        public string Sha { get; set; }
        public DateTimeOffset Date { get; set; }
        public Dictionary<string, Dictionary<string, object>> Values { get; set; }
    }

    public class LibraryTable {
        static HttpClient client = new HttpClient();
        public static async Task<Dictionary<string, List<Info>>> LoadHistory()
        {
            string path = "mcs/tools/linker/wasm-linked-size.csv";
            string repo = "mono/mono";
            var items = new Dictionary<string, Commit> ();
            var allApps = new Dictionary<string, List<Info>> ();
            var commits = await GetCommits (path, repo);
            var watch = Stopwatch.StartNew();
            foreach(var revision in commits) {
                var table = await GetRaw (path, revision.sha, repo);
                //var table = ReadTable(stream);
                var commit = new Commit {
                    Sha = revision.sha,
                    Date = revision.date,
                    Values = new Dictionary<string, Dictionary<string, object>>()
                };

                var columns = table.Columns.Cast<DataColumn>().ToArray();
                for (int i = table.Rows.Count-1; i>=0; i--) {
                    var values = table.Rows[i].ItemArray;
                    commit.Values[values[0].ToString()] = Enumerable
                                                            .Range(0, values.Length)
                                                            .ToDictionary(col => columns[col].ColumnName, col => values[col]);
                }
                items[revision.sha] = commit;
            }
            watch.Stop();
            Console.WriteLine("other history " + watch.ElapsedMilliseconds);
            return FormatCsv(items.Values);
        }

        public static Dictionary<string, List<Info>> FormatCsv(IEnumerable<Commit> commits)
        {
            Dictionary<string, List<Info>> apps = new Dictionary<string, List<Info>>();
            foreach (var commit in commits.OrderBy (c => c.Date)) {
                foreach(var app in commit.Values.Keys) {
                    if (!commit.Values.TryGetValue(app, out var row))
                        continue;
                    if (!apps.ContainsKey(app))
                        apps.Add(app, new List<Info>());
                    row.Remove("App");
                    row.Add(app, commit.Sha.Substring(0, 8));
                    row.Add("Date", commit.Date.ToString("O"));
                    apps[app].Add(new Info{ Library=row });
                }
            }
            return apps;
        }

        public static async Task<DataTable> GetRaw (string path, string sha, string repo)
        {
            var location = new Uri($"https://raw.githubusercontent.com/{repo}/{sha}/{path}");
            using (HttpResponseMessage response = await client.GetAsync(location, HttpCompletionOption.ResponseHeadersRead))
            using (Stream stream = await response.Content.ReadAsStreamAsync()) 
            using (BufferedStream bs = new BufferedStream(stream)){
                // using (var reader = new StreamReader(stream)) {
                //     var data = await reader.ReadToEndAsync();
                    return ReadTable(bs);
                // }
                
            }
            //return await client.GetStreamAsync(location);
        }
        public static async Task<(string sha, DateTimeOffset date) []> GetCommits(string path, string repo)
        {
            try {
                string data = String.Empty;
                var obj = new [] {
                    new {
                        sha = "",
                        commit = new {
                            author = new {
                                date = DateTimeOffset.Now
                            }
                        }
                    }
                };

                client.DefaultRequestHeaders.Add("Accept", "*/*");
                client.DefaultRequestHeaders.Add("User-Agent", "curl/7.54.0");
                var watch = Stopwatch.StartNew();

                using(HttpResponseMessage response = await client.GetAsync(new Uri ($"https://api.github.com/repos/{repo}/commits?path={path}"), HttpCompletionOption.ResponseHeadersRead))
                using (Stream streamToReadFrom = await response.Content.ReadAsStreamAsync()) {
                using (var bs = new BufferedStream(streamToReadFrom)) 
                    using (var reader = new StreamReader(bs)){
                        data = await reader.ReadToEndAsync();
                    }
                }
                // var data = await client.GetStringAsync ( new Uri ($"https://api.github.com/repos/{repo}/commits?path={path}"));
                watch.Stop();
                Console.WriteLine("get commits " + watch.ElapsedMilliseconds);
                var json = JsonConvert.DeserializeAnonymousType (data, obj).Select (o => ValueTuple.Create (o.sha, o.commit.author.date)).ToArray();
                return json;              
            } catch (Exception e) {
                Console.WriteLine(e.ToString());
                return Array.Empty<(string sha, DateTimeOffset date)>();
            }
        }

        public static DataTable ReadTable (Stream stream) {
            using (var reader = new StreamReader(stream))
            using (var csv = new CsvReader(reader))
            using (var dr = new CsvDataReader(csv)) {
                var dt = CreateTable();
                dt.Load(dr);
                return dt;
            }
        }

        public static DataTable CreateTable () {
			var dt = new DataTable ();

			dt.Columns.Add ("App", typeof (string));
			foreach (var col in new [] {
				"mscorlib.dll",
				"System.dll",
				"System.Core.dll",
				"System.Xml.dll",
				"I18N.CJK.dll",
				"I18N.MidEast.dll",
				"I18N.Other.dll",
				"I18N.Rare.dll",
				"I18N.West.dll",
				"I18N.dll",
				"Microsoft.CSharp.dll",
				"System.ComponentModel.Composition.dll",
				"System.ComponentModel.DataAnnotations.dll",
				"System.Data.Services.Client.dll",
				"System.Data.dll",
				"System.Drawing.dll",
				"System.IO.Compression.FileSystem.dll",
				"System.IO.Compression.dll",
				"System.IdentityModel.dll",
				"System.Json.dll",
				"System.Net.Http.WinHttpHandler.dll",
				"System.Net.Http.dll",
				"System.Net.dll",
				"System.Numerics.Vectors.dll",
				"System.Numerics.dll",
				"System.Reflection.Context.dll",
				"System.Runtime.CompilerServices.Unsafe.dll",
				"System.Runtime.Serialization.dll",
				"System.Security.dll",
				"System.ServiceModel.Internals.dll",
				"System.ServiceModel.Web.dll",
				"System.ServiceModel.dll",
				"System.Transactions.dll",
				"System.Web.Services.dll",
				"System.Windows.dll",
				"System.Xml.Linq.dll",
				"System.Xml.Serialization.dll" }) {
				dt.Columns.Add (col, typeof (int));
			}
			return dt;
		}
    }
}
