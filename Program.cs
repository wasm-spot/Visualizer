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

namespace SizeDiff {
	class Commit {
		public string Sha { get; set; }
		public DateTimeOffset Date { get; set; }
		public Dictionary<string, Dictionary<string, object>> Values { get; set; }

	}

	class Program {
		static HttpClient client = new HttpClient ();

		static async Task Main (string [] args)
		{
			string app = (args.Length > 0) ? args[0] : "System.Net.Http/test-handler-01.exe";
			await LoadHistory ("mcs/tools/linker/wasm-linked-size.csv", app);
		}

		public static async Task LoadHistory (string path, string app, string repo = "mono/mono")
		{
			var items = new Dictionary<string, Commit> ();
			var commits = await GetCommits (path, repo);
			foreach (var revision in commits) {
				var stream = await GetRaw (path, revision.sha, repo);
				var table = ReadTable (stream);
				var commit = new Commit { Sha = revision.sha, Date = revision.date, Values = new Dictionary<string, Dictionary<string, object>> () };
				var columns = table.Columns.Cast<DataColumn> ().ToArray ();

				for (int i = table.Rows.Count - 1; i >= 0; i--) {
					var values = table.Rows [i].ItemArray;
					commit.Values [values [0].ToString ()] = Enumerable.Range (0, values.Length).ToDictionary (col => columns [col].ColumnName, col => values [col]);
				}
				items [revision.sha] = commit;
			}

			//string app = items.Values.Last ().Values.Keys.Last ();
			//app = "System.Net.Http/test-handler-01.exe";
			//app = "Newtonsoft.Json.Test/bin/iPhoneSimulator/Release/Newtonsoft.Json.Test.exe";
			Console.Write (FormatCsv (items.Values, app));
		}

		public static string FormatCsv (IEnumerable<Commit> commits, string app)
		{
			string output = null;
			foreach (var commit in commits.OrderBy (c => c.Date)) {
				if (!commit.Values.TryGetValue (app, out var row))
					continue;

				if (output == null) {
					output += $"{app},date,{row.Keys.Skip (1).Aggregate ((a, b) => $"{a},{b}")}\n";
				}
				output += $"{commit.Sha.Substring (0, 8)},{commit.Date.ToString ("O")},{row.Values.Skip (1).Aggregate ((a, b) => $"{a},{b ?? 0}")}\n";
			}
			return output;
		}

#if false
		public string FormatChartJson (IEnumerable<Commit> commits, string app)
		{
			/*
			{
				"label": "66e88b",
				"backroundColor": "rgba(255, 99, 132, 0.2)",
				"data": [ ]
			}
			*/

			var obj = commits.Select (commit => new {
				label = Commit.Values[app]?.Keys.First() ?? "",
				color = "rgba(255, 99, 132, 0.2)",
				data = Commit.Vales[app]?.Values.F
	 		});

			string output = null;
			foreach (var commit in commits) {
				if (!commit.Values.TryGetValue (app, out var row))
					continue;

				if (output == null) {
					output += $"{app},date,{row.Keys.Skip (1).Aggregate ((a, b) => $"{a},{b}")}\n";
				}
				output += $"{commit.Sha},{commit.Date.ToString ("O")},{row.Values.Skip (1).Aggregate ((a, b) => $"{a},{b ?? 0}")}\n";
			}
			return output;
        }
#endif
		public static Task<Stream> GetRaw (string path, string sha, string repo)
		{
			var location = new Uri ($"https://raw.githubusercontent.com/{repo}/{sha}/{path}");
			return client.GetStreamAsync (location);
		}

		public static async Task<(string sha, DateTimeOffset date)[]> GetCommits (string path, string repo)
		{
			try {
				client.DefaultRequestHeaders.Add ("Accept", "*/*");
				client.DefaultRequestHeaders.Add ("User-Agent", "curl/7.54.0");

				var data = await client.GetStringAsync (new Uri ($"https://api.github.com/repos/{repo}/commits?path={path}"));
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

				return JsonConvert.DeserializeAnonymousType (data, obj).Select (o => ValueTuple.Create (o.sha, o.commit.author.date)).ToArray ();
			} catch (Exception e) {
				Console.WriteLine (e.ToString ());
				return Array.Empty<(string sha, DateTimeOffset date)> ();
			}
		}

		public static DataTable ReadTable (Stream stream) {
			using (var reader = new StreamReader (stream))
			using (var csv = new CsvReader (reader))
			using (var dr = new CsvDataReader (csv)) {
				var dt = CreateTable ();
				dt.Load (dr);
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
