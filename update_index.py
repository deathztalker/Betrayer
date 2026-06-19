import os
import re

html_path = r'c:\Users\Death\OneDrive\Documentos\Betrayer\betrayer-site\index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

def replace_card(song_id, base_name, label, versions):
    global html
    # Use re.DOTALL to match everything inside merch-img-wrap until its closing </div>
    pattern = r'(\s*)<div class=\"merch-img-wrap gallery-tile\" data-full-src=\"assets/merch/' + base_name + r'\.jpg\">.*?</div>\s*</div>'
    
    match = re.search(pattern, html, re.DOTALL)
    if not match:
        print(f'Could not find {base_name}')
        return
    indent = match.group(1)
    
    res = f'{indent}<div class=\"merch-carousel-container\">'
    res += f'{indent}  <div class=\"merch-carousel\">'
    
    for i, v in enumerate(versions):
        suffix = '' if v == 1 else f'_v{v}'
        res += f'{indent}    <div class=\"merch-img-wrap gallery-tile\" data-full-src=\"assets/merch/{base_name}{suffix}.jpg\">'
        res += f'{indent}      <img src=\"assets/merch/thumbs/{base_name}{suffix}.jpg\" alt=\"{label} V{v}\" loading=\"lazy\">'
        res += f'{indent}      <div class=\"gallery-overlay\">'
        res += f'{indent}        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7\"/></svg>'
        res += f'{indent}      </div>'
        res += f'{indent}    </div>'
        
    res += f'{indent}  </div>'
    res += f'{indent}  <div class=\"merch-carousel-indicators\">'
    for i in range(len(versions)):
        act = ' active' if i == 0 else ''
        res += f'{indent}    <span class=\"dot{act}\"></span>'
    res += f'{indent}  </div>'
    res += f'{indent}</div>'
    
    html = html[:match.start()] + res + html[match.end():]
    print(f'Replaced {base_name}')

replace_card('sobek', 'merch_tshirt_sobek', 'Polera Betrayer Sobek', [1, 2])
replace_card('krampus', 'merch_tshirt_krampus', 'Polera Betrayer Krampus', [1, 2])
replace_card('pueblo', 'merch_tshirt_pueblo', 'Polera Betrayer Pueblo Muerto', [1, 2])
replace_card('iscariote', 'merch_tshirt_iscariote', 'Polera Betrayer Iscariote', [1, 2])
replace_card('asesino', 'merch_tshirt_asesino', 'Polera Betrayer Asesino Absuelto', [1, 2])
replace_card('abbadon', 'merch_tshirt_abbadon', 'Polera Betrayer Abbadon', [1, 2, 3])
replace_card('dma', 'merch_tshirt_dma', 'Polera Betrayer D.M.A.', [1, 2])

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print('Done!')
