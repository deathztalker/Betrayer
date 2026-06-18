/* =========================================================================
   BETRAYER — site script
   Lo único que normalmente vas a tocar es la sección CONFIG de más abajo.
   ========================================================================= */

(function () {
  "use strict";

  /* =======================================================================
     CONFIG — edita aquí para actualizar tocatas, galería y Spotify
     ======================================================================= */

  // TOCATAS: agrega un objeto nuevo por cada fecha. El badge "PRÓXIMA" o
  // "REALIZADA" se calcula solo comparando con la fecha de hoy, no hay que
  // editarlo a mano. Usa formato de fecha "AAAA-MM-DD".
  var SHOWS = [
    {
      date: "2026-05-15",
      city: "Talca",
      venue: "Central Bar",
      billing: "Season ov Treason Tour · Dogma, Suicide Nation, Monjes Blancos y Betrayer",
      ticketUrl: null
    }
    // { date: "2026-09-12", city: "Curicó", venue: "Nombre del local", billing: "Detalle de la fecha", ticketUrl: "https://..." },
  ];

  // GALERÍA: agrega las rutas a tus fotos reales en assets/gallery/ y
  // aparecerán automáticamente reemplazando los cuadros vacíos.
  // Ejemplo: "assets/gallery/show-curico-01.jpg"
  var GALLERY = [
    "assets/gallery/central-bar-01.jpg",
    "assets/gallery/central-bar-03.jpg",
    "assets/gallery/central-bar-02.jpg"
    // "assets/gallery/foto-4.jpg",
  ];
  var GALLERY_MIN_TILES = 8; // cantidad mínima de casilleros a mostrar

  // SPOTIFY: pega aquí el ID de artista de Spotify cuando lo tengas
  // (Spotify → tu perfil de artista → Compartir → Insertar artista →
  // copia solo el ID que aparece en la URL del iframe, después de "/artist/").
  var SPOTIFY_ARTIST_ID = ""; // ej: "1a2B3c4D5e6F7g8H9i0J"
  var SPOTIFY_SEARCH_FALLBACK = "https://open.spotify.com/search/Betrayer%20Talca%20Chile";

  /* =======================================================================
     Utilidades
     ======================================================================= */
  var MONTHS_ES = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];

  function parseISODate(iso) {
    var parts = iso.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function isFuture(date) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() >= today.getTime();
  }

  function toArray(nodeList) {
    return Array.prototype.slice.call(nodeList);
  }

  function svgIcon(name) {
    var icons = {
      ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a1.5 1.5 0 0 0 0 3V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5a1.5 1.5 0 0 0 0-3V9Z"/></svg>',
      camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8a2 2 0 0 1 2-2h2l1-2h6l1 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"/><circle cx="12" cy="13" r="3.3"/></svg>',
      user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c1-3.6 4-5.4 7-5.4s6 1.8 7 5.4"/></svg>'
    };
    return icons[name] || "";
  }

  /* =======================================================================
     Render: TOCATAS
     ======================================================================= */
  function renderShows() {
    var board = document.querySelector("[data-shows-board]");
    if (!board) return;

    var sorted = SHOWS.slice().sort(function (a, b) {
      return parseISODate(a.date) - parseISODate(b.date);
    });

    var html = "";
    sorted.forEach(function (show) {
      var d = parseISODate(show.date);
      var future = isFuture(d);
      var day = ("0" + d.getDate()).slice(-2);
      var month = MONTHS_ES[d.getMonth()];
      var year = d.getFullYear();

      html += '<article class="flyer">';
      html += '<div class="flyer-date">' + day + " " + month + '<span class="y">' + year + "</span></div>";
      html += '<span class="flyer-status' + (future ? " is-upcoming" : "") + '">' + (future ? "Próxima" : "Realizada") + "</span>";
      html += '<h3 class="flyer-venue">' + show.venue + "</h3>";
      html += '<div class="flyer-city">' + show.city + ", Chile</div>";
      html += '<p class="flyer-bill">' + show.billing + "</p>";
      if (show.ticketUrl) {
        html += '<a class="flyer-link" href="' + show.ticketUrl + '" target="_blank" rel="noopener">' + svgIcon("ticket") + " Entradas</a>";
      }
      html += "</article>";
    });

    // tarjeta "por anunciar" siempre al final
    html += '<article class="flyer flyer-tba">';
    html += '<span class="mono-tag" style="color:var(--rust-bright)">Próxima fecha</span>';
    html += '<h3 class="flyer-venue" style="margin-top:.6rem">Por anunciar</h3>';
    html += '<p class="flyer-bill" style="border-top:none;padding-top:.4rem">Síguenos en Instagram y Facebook para enterarte de nuevas tocatas.</p>';
    html += "</article>";

    board.innerHTML = html;
  }

  /* =======================================================================
     Render: GALERÍA
     ======================================================================= */
  function renderGallery() {
    var grid = document.querySelector("[data-gallery-grid]");
    if (!grid) return;

    var total = Math.max(GALLERY.length, GALLERY_MIN_TILES);
    var html = "";
    for (var i = 0; i < total; i++) {
      if (GALLERY[i]) {
        html += '<div class="gallery-tile"><img src="' + GALLERY[i] + '" alt="Betrayer en vivo" loading="lazy"></div>';
      } else {
        html += '<div class="gallery-tile is-empty">' + svgIcon("camera") + "</div>";
      }
    }
    grid.innerHTML = html;
  }

  /* =======================================================================
     Render: SPOTIFY
     ======================================================================= */
  function renderSpotify() {
    var mount = document.querySelector("[data-spotify-mount]");
    var link = document.querySelector("[data-spotify-link]");
    if (link) {
      link.href = SPOTIFY_ARTIST_ID
        ? "https://open.spotify.com/artist/" + SPOTIFY_ARTIST_ID
        : SPOTIFY_SEARCH_FALLBACK;
    }
    if (!mount) return;
    if (SPOTIFY_ARTIST_ID) {
      mount.innerHTML =
        '<iframe style="border-radius:6px" src="https://open.spotify.com/embed/artist/' +
        SPOTIFY_ARTIST_ID +
        '?utm_source=generator&theme=0" width="100%" height="352" frameborder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>';
    }
  }

  /* =======================================================================
     Nav: scroll state, mobile toggle, active link, smooth anchor close
     ======================================================================= */
  function setupNav() {
    var nav = document.querySelector("[data-nav]");
    var toggle = document.querySelector("[data-nav-toggle]");
    var links = document.querySelectorAll("[data-nav-link]");
    if (!nav) return;

    function onScroll() {
      nav.classList.toggle("is-scrolled", window.scrollY > 30);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle) {
      toggle.addEventListener("click", function () {
        nav.classList.toggle("is-open");
      });
    }
    toArray(links).forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
      });
    });

    // resaltar el link activo según la sección visible
    var sections = Array.prototype.map.call(links, function (l) {
      return document.querySelector(l.getAttribute("href"));
    }).filter(Boolean);

    if ("IntersectionObserver" in window && sections.length) {
      var obs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var id = "#" + entry.target.id;
              toArray(links).forEach(function (l) {
                l.classList.toggle("is-active", l.getAttribute("href") === id);
              });
            }
          });
        },
        { rootMargin: "-45% 0px -50% 0px" }
      );
      sections.forEach(function (s) { obs.observe(s); });
    }
  }

  /* =======================================================================
     Scroll reveal
     ======================================================================= */
  function setupReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || !items.length) {
      toArray(items).forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    toArray(items).forEach(function (el) { obs.observe(el); });
  }

  /* =======================================================================
     Misc: año en footer
     ======================================================================= */
  function setupYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* =======================================================================
     Init
     ======================================================================= */
  // Mark JS as available as early as possible so the CSS-based reveal
  // animation only activates when it can actually be controlled by JS.
  // If this script fails to load at all, content stays visible by default.
  document.body.classList.add("js-ready");

  function safe(fn) {
    try { fn(); } catch (err) { console.error("Betrayer site script error:", err); }
  }

  document.addEventListener("DOMContentLoaded", function () {
    safe(renderShows);
    safe(renderGallery);
    safe(renderSpotify);
    safe(setupNav);
    safe(setupReveal);
    safe(setupYear);
  });
})();
