using System;
using System.IO;
using System.Collections.Generic;
using Newtonsoft.Json;
using System.Linq;
using System.Text;

namespace LinkerParser
{
    public class Link {
        public int source { get; set; }
        public int target { get; set; }
        public int value { get; set; }
    }

    public class Node {
        public string name { get; set; }
    }

    public class Json {
        public List<Node> nodes { get; set; }
        public List<Link> links { get; set; }
    }

    class Program
    {
        public static List<string> nodes = new List<string>();
        public static Dictionary<(string, string), int> link_dict = new Dictionary<(string, string), int>();

        public static string getHeaderName(string name) {
            return name.Split(" ")[1];
        }

        public static string getName(string name) {
            name = name.Substring(3);
            if (name.Contains("deps")) {
                name = name.Substring(0, name.Length - 9);
            }
            name = String.Join(":", name.Split(":").Skip(1));
            name = name.Replace(",", " ");
            return name;
        }

        public static int getNodeIndex(string name) {
            int ix = nodes.IndexOf(name);
            if (ix == -1) {
                nodes.Add(name);
                ix = nodes.Count() - 1;
            }

            return ix;
        }

        public static void Parse(string filepath) {
            StreamReader reader = File.OpenText(filepath);
            string line;
            string name, src_name;
            while ((line = reader.ReadLine()) != null) {
                if (line.StartsWith("---")) {
                    name = getHeaderName(line);
                } else if (line.StartsWith("\t|")) {
                    name = getName(line);
                    var next = reader.ReadLine();
                    if (next.StartsWith("\t|")) {
                        src_name = getName(next);
                        var pair = (src_name, name);
                        if (link_dict.ContainsKey(pair)) {
                            link_dict[pair] += 1;
                        } else {
                            link_dict[pair] = 1;
                        }
                    }
                }
            }
        }
        static void Main(string[] args)
        {
            Parse("data/linker-dependencies.xml");

            List<Link> links = link_dict.Where((item) => item.Value > 500)
                    .Select((item) => {
                    return new Link{
                        source=getNodeIndex(item.Key.Item1),
                        target=getNodeIndex(item.Key.Item2),
                        value=item.Value
                    };
                
            }).ToList();

            List<Node> node_list = nodes.Select((n, i) => {
                return new Node{name=n};
            }).ToList();

            string json = JsonConvert.SerializeObject(new Json{nodes=node_list, links=links});

            File.WriteAllText("data/linker-dependencies.json", json);
        }
    }
}
