import re

html_path = r'c:\Users\Death\OneDrive\Documentos\Betrayer\betrayer-site\index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

arrows_html = '''
  <button class="merch-arrow prev" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>
  <button class="merch-arrow next" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></button>
'''

html = re.sub(
    r'(<div class="merch-carousel-container">)',
    r'\1\n' + arrows_html,
    html
)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print('Arrows added')
