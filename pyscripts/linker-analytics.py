import requests
import pandas as pd
from threading import Thread
from queue import Queue

class SizeExplorer():

    commit_link = ""
    prefix = "https://raw.githubusercontent.com/mono/mono/"
    ending = "/mcs/tools/linker/wasm-linked-size.csv"

    def __init__(self, link):
        self.commit_link = link

    def extract_link(self, tag):
        return tag.select("a")[0].get('href')

    def get_commit(self, link):
        return link.split('/')[4].split('#')[0]

    def create_raw_link(self, commit):
        link = self.prefix + commit + self.ending
        return link

    def load_history(self):
        r = requests.get(self.commit_link)
        commits = r.json()
        commits = [[c['commit']['author']['date'], 
            self.create_raw_link(c['sha']), c['sha']] for c in commits]
        return commits
        
class AppTable(Thread):

    def __init__(self, apps, lib):
        Thread.__init__(self)
        self.apps = apps
        self.lib = lib
        self.app_dfs = self.init_app_dfs()

    def parse_csv(self, url):
        csv = pd.read_csv(url)
        return csv
    
    def app_df(self):
        df = {l:[] for l in self.lib}
        df.update({"Date": [], "Commit": []})
        return df

    def init_app_dfs(self):
        return {app: self.app_df() for app in self.apps}

    def separate_df(self, df, dates, sha, i):
        for index, row in df.iterrows():
            df = self.app_dfs[row['App']]
            df['Date'].append(dates[i]) 
            df['Commit'].append(sha[i])
            for lib in self.lib:
                if lib in row:
                    df[lib].append(row[lib])
                else:
                    df[lib].append(0)

    def separate_apps(self, commits):
        raw = [c[1] for c in commits]
        dates = [c[0] for c in commits]
        sha = [c[2] for c in commits]
        for i, link in enumerate(raw):
            df = self.parse_csv(link)
            self.separate_df(df, dates, sha, i)
        for app in self.app_dfs:
            self.app_dfs[app] = pd.DataFrame(self.app_dfs[app])
            name = app.replace('/', '-').replace('.', '-')
            self.app_dfs[app].to_csv("app-csv/" + name + ".csv", index=False)
        return self.app_dfs



def main():
    commit_link = "https://api.github.com/repos/mono/mono/commits?path=mcs/tools/linker/wasm-linked-size.csv" 
    explorer = SizeExplorer(commit_link)
    commits = explorer.load_history()
    df = pd.read_csv(commits[0][1])
    apps = list(df['App'])
    lib = list(df.columns)[1:]
    table = AppTable(apps, lib)
    app_tables = table.separate_apps(commits)
    print(app_tables['HelloWorld/bin/Release/netstandard2.0/dist/_framework/_bin/HelloWorld.dll'])

if __name__ == "__main__":
    main()