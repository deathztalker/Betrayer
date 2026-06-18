# Betrayer — sitio web de la banda

Sitio estático (HTML + CSS + JS, sin frameworks ni build step) para Betrayer, banda de thrash metal de Talca, Región del Maule, Chile. Pensado para subirlo directo a GitHub Pages.

## Estructura del proyecto

```
betrayer-site/
├── index.html              ← toda la estructura y el contenido de texto
├── css/
│   └── style.css            ← estilos, colores, tipografías, breakpoints
├── js/
│   └── script.js             ← tocatas, galería, Spotify, menú móvil (ver CONFIG)
└── assets/
    ├── logo.png               ← logo principal (fondo transparente)
    ├── logo-red.png            ← variante en rojo, por si la quieres usar
    ├── og-image.jpg             ← imagen que se muestra al compartir el link
    ├── favicon-16.png, favicon-32.png, apple-touch-icon.png, icon-512.png
    ├── grain.png                 ← textura de grano usada de fondo
    ├── gallery/                   ← fotos de la galería (ya tiene 3 del Central Bar)
    └── members/                    ← déjale aquí las fotos de cada integrante
```

## Publicarlo en GitHub Pages

1. Crea un repositorio nuevo en GitHub (puede ser público o privado, pero Pages gratis necesita que sea público salvo que tengas plan pagado).
2. Sube todos los archivos de esta carpeta manteniendo la misma estructura (osea que `index.html` quede en la raíz del repo, no dentro de una subcarpeta).
3. En el repo, ve a **Settings → Pages**.
4. En **Source**, elige la rama (`main`) y la carpeta `/ (root)`.
5. Guarda. GitHub te va a dar una URL del tipo `https://tu-usuario.github.io/nombre-del-repo/` — puede tardar uno o dos minutos en quedar activa.

Todos los enlaces a `css/`, `js/` y `assets/` están escritos como rutas relativas (sin `/` al inicio), así que funcionan igual si el sitio queda en la raíz de un dominio o dentro de una subcarpeta como `/nombre-del-repo/`.

## Cosas que dejé listas para que edites tú

Te marqué cada una con un comentario `TODO (Talca)` directo en el código para que las encuentres fácil buscando esa palabra.

### Fotos de la formación
No pude sacar fotos automáticamente de Facebook/Instagram (esas plataformas bloquean el acceso a herramientas automatizadas), así que cada integrante tiene un ícono genérico por ahora. Para poner la foto real de alguien:

1. Guarda la foto en `assets/members/` (ej: `assets/members/matias.jpg`).
2. En `index.html`, busca la tarjeta de esa persona y reemplaza el bloque `<div class="member-photo">...</div>` (el que tiene el ícono SVG adentro) por:
   ```html
   <div class="member-photo"><img src="assets/members/matias.jpg" alt="Matías Bravo"></div>
   ```

### Galería
Ya dejé las 3 fotos del show en Central Bar. Para agregar más, ábrelas en `assets/gallery/` y súmalas al arreglo `GALLERY` en `js/script.js`:

```js
var GALLERY = [
  "assets/gallery/central-bar-01.jpg",
  "assets/gallery/central-bar-03.jpg",
  "assets/gallery/central-bar-02.jpg",
  "assets/gallery/tu-foto-nueva.jpg",
];
```

Los casilleros vacíos (con el ícono de cámara) se rellenan solos a medida que agregas fotos — no hay que tocar el HTML.

### Spotify
Busqué el perfil de Betrayer en Spotify pero hay varias bandas internacionales con el mismo nombre y no pude confirmar cuál de todas son ustedes, así que dejé el botón apuntando a una búsqueda genérica por ahora. Cuando tengas el link real:

1. Entra a tu perfil de artista en Spotify (desde la app o la web).
2. Click en **Compartir → Insertar artista** (Share → Embed artist).
3. Te va a dar un código con algo como `open.spotify.com/embed/artist/ALGO_ASI`. Copia solo esa parte después de `/artist/`.
4. Pégala en `js/script.js`:
   ```js
   var SPOTIFY_ARTIST_ID = "pega-aquí-el-id";
   ```
5. Con eso aparece automáticamente el reproductor embebido bajo el tracklist.

### Tocatas
Están en el arreglo `SHOWS` en `js/script.js`. El cartel de «Próxima» o «Realizada» se calcula solo comparando con la fecha de hoy, así que no hay que tocarlo a mano:

```js
var SHOWS = [
  {
    date: "2026-05-15",
    city: "Talca",
    venue: "Central Bar",
    billing: "Season ov Treason Tour · Dogma, Suicide Nation, Monjes Blancos y Betrayer",
    ticketUrl: null
  },
  // agrega más fechas con el mismo formato:
  // { date: "2026-09-12", city: "Curicó", venue: "Nombre del local", billing: "Detalle", ticketUrl: "https://..." },
];
```

### Correo de contacto
No inventé un correo porque no quería poner uno que no exista. Por defecto el botón de booking manda a Instagram. Si quieres recibir consultas por correo, en `index.html` (sección Contacto) hay un botón comentado — descomenta esa línea y pon tu email real ahí.

### Bio
Los dos párrafos de «La banda» los escribí con la información pública que encontré (Talca, thrash metal, disco de 2019, etc.). Si quieres que suene más a como ustedes se describirían, edítalos directo en `index.html`, sección `id="la-banda"`.

## Personalizar colores y tipografías

Todo el look está controlado por variables CSS al principio de `css/style.css`:

```css
:root{
  --ink:    #0a0908;   /* fondo */
  --bone:   #e7e0d2;   /* texto principal */
  --blood:  #7d1414;   /* rojo principal */
  --rust:   #b5571f;   /* acento secundario */
  --paper:  #ddd2b6;   /* color "papel" de las tarjetas de tocatas */
  ...
  --font-display: "Big Shoulders", sans-serif;
  --font-body: "Work Sans", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
```

Cambiando esos valores cambia todo el sitio de una vez (botones, títulos, bordes, etc.), sin tener que ir rastreando cada regla por separado.

## Notas técnicas

- Sin frameworks ni paso de build: es HTML/CSS/JS puro, así que cualquier editor de texto sirve para modificarlo.
- El menú y las animaciones de aparición funcionan aunque JavaScript falle o cargue lento — el contenido siempre es visible por defecto; JS solo agrega el efecto.
- El reproductor de Bandcamp usa el embed oficial del álbum *Betrayer* (2019), así que no necesita configuración aparte.
