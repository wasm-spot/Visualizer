using System.Xml;
using System.Net.Http;
using System.Threading.Tasks;
using System.IO;


namespace XML {
    public class XML{
        
    }

    public class Data {
        static HttpClient client = new HttpClient();
        public static async Task getXML(string path) {
            XmlReaderSettings settings = new XmlReaderSettings();
            settings.Async = true;
            
            using(HttpResponseMessage response = await client.GetAsync(path, HttpCompletionOption.ResponseHeadersRead))
            using (Stream stream = await response.Content.ReadAsStreamAsync()) 
            using (XmlReader reader = XmlReader.Create(stream, settings)) {
                reader.MoveToContent();
                reader.ReadToDescendant("assembly");
            }
        }
    }
    

}