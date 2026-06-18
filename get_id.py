import urllib.request, re
html = urllib.request.urlopen('https://www.youtube.com/@betrayerbanda9669').read().decode('utf-8')
m = re.search(r'"channelId":"(UC[^"]+)"', html)
print(m.group(1) if m else "Not found")
