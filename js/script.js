/* =========================================================================
   BETRAYER — site script
   Lo único que normalmente vas a tocar es la sección CONFIG de más abajo.
   ========================================================================= */

(function () {
  "use strict";

  /* =======================================================================
     CONFIG — edita aquí para actualizar tocatas, galería y Spotify
     ======================================================================= */

  // TOCATAS: se leen AUTOMÁTICAMENTE desde data/shows.json.
  // Para agregar una tocata, edita ese archivo, haz commit y push.
  // Este arreglo es respaldo por si el JSON no carga (ej: desarrollo local).
  var SHOWS = [
    {
      date: "2026-05-15",
      city: "Talca",
      venue: "Central Bar",
      billing: "Season ov Treason Tour · Dogma, Suicide Nation, Monjes Blancos y Betrayer",
      ticketUrl: null
    }
  ];

  // GALERÍA: las fotos se descubren AUTOMÁTICAMENTE desde GitHub.
  // Solo sube tus fotos a assets/gallery/, haz commit y push.
  // Este arreglo sirve como respaldo si la API de GitHub no responde.
  var GALLERY = [
    "assets/gallery/central-bar-01.webp",
    "assets/gallery/central-bar-03.webp",
    "assets/gallery/central-bar-02.webp"
  ];
  var GALLERY_MIN_TILES = 8; // cantidad mínima de casilleros a mostrar

  // FOTOS DE INTEGRANTES: también se descubren automáticamente.
  // Nombra el archivo como el integrante (sin tildes, con guiones):
  //   matias-bravo.jpg  →  Matías Bravo
  //   juan-vasquez.jpg  →  Juan Vásquez
  //   felipe-toloza.jpg →  Felipe Toloza
  // Súbelas a assets/members/, commit y push. Listo.

  // GITHUB: repo público para auto-descubrir fotos
  var GITHUB_REPO = "deathztalker/Betrayer";

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

  // Normaliza un string para comparar nombres de archivo con nombres de integrantes:
  // "Matías Bravo" → "matias-bravo", "juan-vasquez.jpg" → "juan-vasquez"
  function normalizeStr(str) {
    return str.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar tildes
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  // Consulta la API de GitHub para listar archivos de una carpeta.
  // Usa sessionStorage como caché para no gastar el rate limit (60/hora).
  function fetchGitHubDir(path, callback) {
    var cacheKey = "betrayer_gh_v2_" + path;
    try {
      var cached = sessionStorage.getItem(cacheKey);
      if (cached) { callback(JSON.parse(cached)); return; }
    } catch (e) { /* sessionStorage no disponible, seguir sin caché */ }

    var url = "https://api.github.com/repos/" + GITHUB_REPO + "/contents/" + path;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.setRequestHeader("Accept", "application/vnd.github.v3+json");
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var files = JSON.parse(xhr.responseText);
          var items = files
            .filter(function (f) { return f.type === 'file' && /\.(jpe?g|png|webp|gif)$/i.test(f.name); })
            .map(function (f) { return f.path; });
          try { sessionStorage.setItem(cacheKey, JSON.stringify(items)); } catch (e) {}
          callback(items);
        } catch (e) { callback(null); }
      } else {
        callback(null);
      }
    };
    xhr.onerror = function () { callback(null); };
    xhr.send();
  }

  /* =======================================================================
     Render: TOCATAS — auto-carga desde data/shows.json
     ======================================================================= */
  function renderShows() {
    var board = document.querySelector("[data-shows-board]");
    if (!board) return;

    // mostrar respaldo inmediatamente
    fillShowsBoard(board, SHOWS);

    // intentar cargar desde JSON
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "data/shows.json");
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data && data.length) {
            SHOWS = data;
            fillShowsBoard(board, SHOWS);
          }
        } catch (e) { /* JSON inválido, mantener el respaldo */ }
      }
    };
    xhr.onerror = function () { /* sin conexión, mantener respaldo */ };
    xhr.send();
  }

  function fillShowsBoard(board, shows) {
    var sorted = shows.slice().sort(function (a, b) {
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
      if (show.flyer) {
        html += '<img class="flyer-img" src="' + show.flyer + '" alt="Afiche ' + show.venue + '" loading="lazy">';
      }
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
    html += '<p class="flyer-bill" style="border-top:none;padding-top:.4rem">Síguenos en <a href="https://www.instagram.com/betrayer_chile/" target="_blank" rel="noopener" class="link-ig">Instagram</a> y <a href="https://www.facebook.com/betrayerbanda" target="_blank" rel="noopener" class="link-fb">Facebook</a> para enterarte de nuevas tocatas.</p>';
    html += "</article>";

    board.innerHTML = html;
  }

  /* =======================================================================
     Render: GALERÍA — carga directamente desde el arreglo GALLERY
     Paginated: shows GALLERY_PAGE_SIZE images at a time with "Load more"
     Uses thumbs/ subdirectory for grid thumbnails
     ======================================================================= */
  var GALLERY_PAGE_SIZE = 24;
  var galleryPage = 0;
  var galleryPhotos = [];

  function renderGallery() {
    var grid = document.querySelector("[data-gallery-grid]");
    if (!grid) return;

    // Cargar directamente desde el arreglo estático GALLERY
    galleryPhotos = GALLERY.filter(function(src) { return !!src; });
    galleryPage = 0;
    fillGalleryGrid(grid, galleryPhotos);
  }

  function getThumbPath(fullPath) {
    // assets/gallery/photo.jpg -> assets/gallery/thumbs/photo.jpg
    var parts = fullPath.split('/');
    var filename = parts.pop();
    return parts.join('/') + '/thumbs/' + filename;
  }

  function fillGalleryGrid(grid, photos) {
    var endIndex = Math.min((galleryPage + 1) * GALLERY_PAGE_SIZE, photos.length);
    var startIndex = galleryPage === 0 ? 0 : galleryPage * GALLERY_PAGE_SIZE;
    var html = galleryPage === 0 ? '' : grid.innerHTML;
    
    // Remove existing load-more button if re-rendering
    var existingBtn = grid.parentNode.querySelector('.gallery-load-more');
    if (existingBtn) existingBtn.remove();

    for (var i = startIndex; i < endIndex; i++) {
      if (photos[i]) {
        var thumbSrc = getThumbPath(photos[i]);
        html += '<div class="gallery-tile" data-full-src="' + photos[i] + '">';
        html += '<img src="' + thumbSrc + '" alt="Betrayer en vivo" loading="lazy" onerror="this.src=\'' + photos[i] + '\'"/>';
        html += '</div>';
      }
    }
    
    grid.innerHTML = html;
    
    // Add "Load more" button if there are more photos
    if (endIndex < photos.length) {
      var remaining = photos.length - endIndex;
      var btn = document.createElement('button');
      btn.className = 'btn btn-ghost gallery-load-more';
      btn.textContent = 'Cargar más (' + remaining + ' restantes)';
      btn.addEventListener('click', function() {
        galleryPage++;
        fillGalleryGrid(grid, galleryPhotos);
      });
      grid.parentNode.appendChild(btn);
    }
  }

  /* =======================================================================
     Render: VIDEOS — lee desde data/videos.json
     ======================================================================= */
  function renderVideos() {
    var carousel = document.querySelector("[data-video-carousel]");
    var mainVideo = document.getElementById("main-video");
    var mount = document.querySelector("[data-videos-mount]");
    if (!carousel || !mainVideo) return;

    var xhr = new XMLHttpRequest();
    xhr.open("GET", "data/videos.json");
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var videos = JSON.parse(xhr.responseText);
          if (!videos || !videos.length) return;

          var html = "";
          videos.forEach(function (vId, idx) {
            var cls = idx === 0 ? "video-thumb is-active" : "video-thumb";
            var thumbUrl = "https://img.youtube.com/vi/" + vId + "/maxresdefault.jpg";
            html += '<div class="' + cls + '" data-video-id="' + vId + '">';
            html += '<img src="' + thumbUrl + '" alt="Miniatura de video">';
            html += '</div>';
          });
          carousel.innerHTML = html;

          // Cargar el primer video en el reproductor principal
          mainVideo.src = "https://www.youtube.com/embed/" + videos[0] + "?autoplay=0";

          // Ocultar el placeholder ahora que los videos cargaron
          var placeholder = document.querySelector('.video-placeholder');
          if (placeholder) placeholder.style.display = 'none';
          mainVideo.style.opacity = '1';

          // Manejar clics en el carrusel
          carousel.addEventListener("click", function (e) {
            var thumb = e.target.closest(".video-thumb");
            if (!thumb) return;
            var vId = thumb.getAttribute("data-video-id");
            if (vId) {
              mainVideo.src = "https://www.youtube.com/embed/" + vId + "?autoplay=1";
              var allThumbs = carousel.querySelectorAll(".video-thumb");
              toArray(allThumbs).forEach(function(t) { t.classList.remove("is-active"); });
              thumb.classList.add("is-active");
            }
          });
        } catch (e) {}
      }
    };
    xhr.send();
  }

  /* =======================================================================
     Auto-match: fotos de integrantes desde assets/members/
     Convención de nombre: matias-bravo.jpg → "Matías Bravo"
     ======================================================================= */
  function autoMatchMemberPhotos() {
    fetchGitHubDir("assets/members", function (photos) {
      if (!photos || !photos.length) return;

      var cards = document.querySelectorAll(".member-card");
      toArray(cards).forEach(function (card) {
        var nameEl = card.querySelector(".name");
        if (!nameEl) return;
        var normalizedName = normalizeStr(nameEl.textContent);

        // buscar una foto que coincida con el nombre
        var match = null;
        for (var i = 0; i < photos.length; i++) {
          var filename = photos[i].split("/").pop().replace(/\.[^.]+$/, "");
          if (normalizeStr(filename) === normalizedName) {
            match = photos[i];
            break;
          }
        }

        if (match) {
          var photoDiv = card.querySelector(".member-photo");
          if (photoDiv) {
            photoDiv.innerHTML = '<img src="' + match + '" alt="' + nameEl.textContent + '">';
          }
        }
      });
    });
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
    var backTopFloat = document.querySelector(".back-top-float");
    if (!nav) return;

    function onScroll() {
      nav.classList.toggle("is-scrolled", window.scrollY > 30);
      if (backTopFloat) {
        backTopFloat.classList.toggle("is-visible", window.scrollY > 500);
      }
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
     Scroll reveal — with stagger for grid children
     ======================================================================= */
  function setupReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || !items.length) {
      toArray(items).forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    // add stagger delays to grid children
    var grids = document.querySelectorAll(".lineup-grid, .gallery-grid, .shows-board");
    toArray(grids).forEach(function (grid) {
      toArray(grid.children).forEach(function (child, i) {
        child.style.transitionDelay = (i * 80) + "ms";
      });
    });

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
     Intelligent Ambient Effects Engine (Multi-Section)
     ======================================================================= */
  function setupAmbientEffects() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var canvases = document.querySelectorAll(".ambient-canvas");
    if (!canvases.length) return;

    var activeEffects = new Map();

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        var canvas = entry.target;
        var state = activeEffects.get(canvas);
        if (!state) return;
        if (entry.isIntersecting) {
          if (!state.animId) {
            state.lastTime = performance.now();
            startEffect(state);
          }
        } else {
          if (state.animId) {
            cancelAnimationFrame(state.animId);
            state.animId = null;
          }
        }
      });
    }, { threshold: 0 });

    canvases.forEach(function(canvas) {
      var section = canvas.parentElement;
      var effectType = canvas.getAttribute("data-effect");
      var state = {
        canvas: canvas,
        ctx: canvas.getContext("2d", { alpha: true }),
        effectType: effectType,
        particles: [],
        animId: null,
        time: 0
      };
      
      function resize() {
        var rect = section.getBoundingClientRect();
        canvas.width = rect.width || window.innerWidth;
        canvas.height = rect.height || window.innerHeight;
        initParticles(state);
      }
      
      resize();
      window.addEventListener("resize", resize);
      activeEffects.set(canvas, state);
      observer.observe(canvas);
    });

    function initParticles(state) {
      state.particles = [];
      var w = state.canvas.width;
      var h = state.canvas.height;
      var i;
      
      if (state.effectType === "embers") {
        var COLORS = [
          { r: 163, g: 28,  b: 28  },
          { r: 181, g: 87,  b: 31  },
          { r: 211, g: 114, b: 47  },
          { r: 230, g: 150, b: 60  }
        ];
        for(i=0; i<50; i++){
          var c = COLORS[Math.floor(Math.random() * COLORS.length)];
          state.particles.push({
            x: Math.random() * w, y: Math.random() * h,
            r: Math.random() * 2 + 0.5,
            vx: (Math.random() - 0.5) * 0.6, vy: -(Math.random() * 1.5 + 0.5),
            life: Math.random() * 100, maxLife: Math.random() * 150 + 50,
            wobbleSpeed: Math.random() * 0.03 + 0.01, wobbleAmp: Math.random() * 0.5 + 0.2,
            color: "rgba(" + c.r + "," + c.g + "," + c.b + ","
          });
        }
      } else if (state.effectType === "ash") {
        for(i=0; i<40; i++){
          state.particles.push({
            x: Math.random() * w, y: Math.random() * h,
            r: Math.random() * 2 + 0.5,
            vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() * 1 + 0.2),
            life: Math.random() * 100, maxLife: Math.random() * 100 + 50,
            wobbleSpeed: Math.random() * 0.02, wobbleAmp: Math.random() * 0.3
          });
        }
      } else if (state.effectType === "dust") {
        for(i=0; i<35; i++){
          state.particles.push({
            x: Math.random() * w, y: Math.random() * h,
            r: Math.random() * 1.5 + 0.2,
            vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
            life: Math.random() * Math.PI * 2
          });
        }
      }
    }

    function startEffect(state) {
      var ctx = state.ctx;
      var w = state.canvas.width;
      var h = state.canvas.height;
      var particles = state.particles;
      var type = state.effectType;

      function draw(now) {
        var dt = (now - state.lastTime) / 16; // approx multiplier for 60fps
        state.lastTime = now;
        if (dt > 3) dt = 3; // cap delta to prevent huge jumps

        ctx.clearRect(0, 0, w, h);
        state.time += 0.02 * dt;

        if (type === "embers") {
          for(var i=0; i<particles.length; i++){
            var p = particles[i];
            p.x += (p.vx + Math.sin(state.time * p.wobbleSpeed) * p.wobbleAmp) * dt;
            p.y += p.vy * dt;
            p.life += dt;
            var alpha = Math.max(0, Math.sin((p.life / p.maxLife) * Math.PI)) * 0.8;
            
            if (p.life >= p.maxLife || p.y < -10 || p.x < -10 || p.x > w + 10) {
              p.y = h + 10; p.x = Math.random() * w; p.life = 0;
            }
            
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
            ctx.fillStyle = p.color + alpha + ")";
            ctx.shadowBlur = p.r * 4;
            ctx.shadowColor = p.color + "0.5)";
            ctx.fill();
          }
          ctx.shadowBlur = 0;

        } else if (type === "ash") {
          for(var i=0; i<particles.length; i++){
            var p = particles[i];
            p.x += (p.vx + Math.sin(state.time * p.wobbleSpeed) * p.wobbleAmp) * dt; 
            p.y += p.vy * dt; // floats down
            p.life += dt;
            
            var alpha = Math.max(0, Math.sin((p.life / p.maxLife) * Math.PI)) * 0.4;
            
            if (p.life >= p.maxLife || p.y > h + 10 || p.x < -10 || p.x > w + 10) {
              p.y = -10; p.x = Math.random() * w; p.life = 0;
            }
            
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
            // Color ceniza oscuro (gris rojizo muy tenue)
            ctx.fillStyle = "rgba(100, 80, 80, " + alpha + ")";
            ctx.fill();
          }

        } else if (type === "dust") {
          for(var i=0; i<particles.length; i++){
            var p = particles[i];
            p.x += (p.vx + Math.sin(p.life) * 0.1) * dt; 
            p.y += p.vy * dt;
            p.life += 0.01 * dt;
            if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
            
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
            ctx.fillStyle = "#ffffff";
            // Aumentar opacidad del polvo
            ctx.globalAlpha = (Math.sin(p.life) + 1) * 0.4;
            ctx.fill();
          }
          ctx.globalAlpha = 1;

        } else if (type === "static") {
          // Esttica ms visible (blanca)
          ctx.fillStyle = "rgba(255,255,255,0.03)";
          if (Math.random() > 0.3) {
            for(var i=0; i<15; i++){
              var y = Math.random() * h;
              var th = Math.random() * 4 + 1;
              ctx.fillRect(0, y, w, th);
            }
          }

        } else if (type === "noise") {
          // Grano fotogrfico ms denso y visible
          ctx.fillStyle = "rgba(255,255,255,0.03)";
          for(var i=0; i<150; i++) {
             ctx.fillRect(Math.random()*w, Math.random()*h, Math.random()*3+1, Math.random()*3+1);
          }
          ctx.fillStyle = "rgba(0,0,0,0.1)";
          for(var i=0; i<150; i++) {
             ctx.fillRect(Math.random()*w, Math.random()*h, Math.random()*3+1, Math.random()*3+1);
          }

        } else if (type === "pulse") {
          var radius = Math.max(w, h) * 0.8;
          var pulse = (Math.sin(state.time * 0.5) + 1) * 0.5; // 0 to 1
          var grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, radius + (pulse * 80));
          // Latido rojo ms fuerte
          grad.addColorStop(0, 'rgba(200, 20, 20, ' + (0.08 + pulse * 0.08) + ')');
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
        }

        state.animId = requestAnimationFrame(draw);
      }
      state.animId = requestAnimationFrame(draw);
    }
  }

  /* =======================================================================
     Gallery lightbox (with Firebase likes & comments)
     ======================================================================= */
  function setupLightbox() {
    var lightbox = document.querySelector("[data-lightbox]");
    var lbImg = document.querySelector("[data-lightbox-img]");
    var lbClose = document.querySelector("[data-lightbox-close]");
    var lbPrev = document.querySelector("[data-lightbox-prev]");
    var lbNext = document.querySelector("[data-lightbox-next]");
    var lbCounter = document.querySelector("[data-lightbox-counter]");
    var lbLikeBtn = document.getElementById("lb-like-btn");
    var lbLikeCount = document.getElementById("lb-like-count");
    var lbCommentsList = document.getElementById("lb-comments-list");
    var lbCommentForm = document.getElementById("lb-comment-form");
    var lbCommentInput = document.getElementById("lb-comment-input");
    var lbCommentName = document.getElementById("lb-comment-name");
    if (!lightbox || !lbImg) return;

    var currentIndex = 0;
    var realPhotos = GALLERY.filter(function (src) { return !!src; });
    var unsubLikes = null;
    var unsubComments = null;

    function getCurrentPath() {
      return realPhotos[currentIndex] || '';
    }

    function attachSocial() {
      detachSocial();
      var path = getCurrentPath();
      if (!path) return;

      // Likes listener
      if (typeof window.fireListenLikes === 'function') {
        unsubLikes = window.fireListenLikes(path, function (data) {
          if (lbLikeCount) lbLikeCount.textContent = data.likes || 0;
          if (lbLikeBtn) {
            if (data.liked) {
              lbLikeBtn.classList.add('is-liked');
            } else {
              lbLikeBtn.classList.remove('is-liked');
            }
          }
        });
      }

      // Comments listener
      if (typeof window.fireListenComments === 'function') {
        unsubComments = window.fireListenComments(path, function (comments) {
          if (!lbCommentsList) return;
          if (!comments.length) {
            lbCommentsList.innerHTML = '<p class="lb-comments-empty">Sin comentarios a\u00fan. \u00a1S\u00e9 el primero!</p>';
            return;
          }
          var html = '';
          comments.forEach(function (c) {
            var timeStr = '';
            if (c.createdAt) {
              var d = c.createdAt;
              timeStr = d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear() + ' ' + 
                        d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
            }
            html += '<div class="lb-comment">';
            html += '<div class="lb-comment-meta"><strong>' + escapeHtml(c.name) + '</strong><span>' + timeStr + '</span></div>';
            html += '<p>' + escapeHtml(c.text) + '</p>';
            html += '</div>';
          });
          lbCommentsList.innerHTML = html;
        });
      }
    }

    function detachSocial() {
      if (unsubLikes) { unsubLikes(); unsubLikes = null; }
      if (unsubComments) { unsubComments(); unsubComments = null; }
    }

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

    function open(index) {
      if (!realPhotos.length) return;
      currentIndex = index;
      lbImg.src = realPhotos[currentIndex];
      if (lbCounter) lbCounter.textContent = (currentIndex + 1) + ' / ' + realPhotos.length;
      lightbox.classList.add('is-active');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      attachSocial();
    }

    function close() {
      lightbox.classList.remove('is-active');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      detachSocial();
    }

    function showPhoto() {
      lbImg.src = realPhotos[currentIndex];
      if (lbCounter) lbCounter.textContent = (currentIndex + 1) + ' / ' + realPhotos.length;
      attachSocial();
    }

    function next() {
      currentIndex = (currentIndex + 1) % realPhotos.length;
      showPhoto();
    }

    function prev() {
      currentIndex = (currentIndex - 1 + realPhotos.length) % realPhotos.length;
      showPhoto();
    }

    // Like button
    if (lbLikeBtn) {
      lbLikeBtn.addEventListener('click', function () {
        if (typeof window.fireToggleLike === 'function') {
          lbLikeBtn.classList.add('lb-like-pop');
          setTimeout(function () { lbLikeBtn.classList.remove('lb-like-pop'); }, 400);
          window.fireToggleLike(getCurrentPath());
        }
      });
    }

    // Comment form
    if (lbCommentForm) {
      lbCommentForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var text = lbCommentInput ? lbCommentInput.value : '';
        var name = lbCommentName ? lbCommentName.value : '';
        if (!text.trim()) return;
        if (typeof window.fireAddComment === 'function') {
          window.fireAddComment(getCurrentPath(), text, name).then(function () {
            if (lbCommentInput) lbCommentInput.value = '';
          });
        }
      });
    }

    // click on gallery tiles
    var grid = document.querySelector('[data-gallery-grid]');
    if (grid) {
      grid.addEventListener('click', function (e) {
        var tile = e.target.closest('.gallery-tile');
        if (!tile) return;
        var fullSrc = tile.getAttribute('data-full-src');
        if (!fullSrc) {
          var img = tile.querySelector('img');
          if (img) fullSrc = img.getAttribute('src');
        }
        if (!fullSrc) return;
        var idx = realPhotos.indexOf(fullSrc);
        if (idx >= 0) open(idx);
      });
    }

    if (lbClose) lbClose.addEventListener('click', close);
    if (lbPrev) lbPrev.addEventListener('click', prev);
    if (lbNext) lbNext.addEventListener('click', next);

    // click outside image to close
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) close();
    });

    // keyboard controls
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-active')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });

    // Touch swipe support
    var touchStartX = 0;
    var touchEndX = 0;
    lbImg.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});
    
    lbImg.addEventListener('touchend', function(e) {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, {passive: true});

    function handleSwipe() {
      if (touchEndX < touchStartX - 50) next(); // Swipe Left
      if (touchEndX > touchStartX + 50) prev(); // Swipe Right
    }
  }

  /* =======================================================================
     Glitch effect — auto-trigger on section titles every ~6s
     ======================================================================= */
  function setupGlitch() {
    var titles = document.querySelectorAll(".section-title");
    // set data-text attribute for pseudo-element content
    toArray(titles).forEach(function (t) {
      t.setAttribute("data-text", t.textContent);
    });

    // auto-glitch a random title every 5-8 seconds
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setInterval(function () {
      var idx = Math.floor(Math.random() * titles.length);
      var t = titles[idx];
      t.classList.add("is-glitching");
      setTimeout(function () { t.classList.remove("is-glitching"); }, 400);
    }, 6000);
  }

  /* =======================================================================
     i18n Multi-Language System
     ======================================================================= */
  function setupI18n() {
    if (typeof I18N_LANGUAGES === 'undefined') return;
    
    var currentLang = localStorage.getItem('betrayer_lang') || 'es';
    var toggleBtn = document.getElementById('currentLangBtn');
    var menuBtnList = document.querySelectorAll('.lang-menu button');
    var flags = { es: '🇨🇱', en: '🇺🇸', de: '🇩🇪', fr: '🇫🇷', it: '🇮🇹', uk: '🇺🇦' };

    function setLanguage(lang) {
      if (!I18N_LANGUAGES[lang]) lang = 'es';
      currentLang = lang;
      localStorage.setItem('betrayer_lang', lang);
      document.documentElement.lang = lang;
      
      if (toggleBtn) {
        var flagSpan = toggleBtn.querySelector('.flag');
        if (flagSpan) flagSpan.textContent = flags[lang] || flags['es'];
      }
      
      var els = document.querySelectorAll('[data-i18n]');
      for (var i = 0; i < els.length; i++) {
        var key = els[i].getAttribute('data-i18n');
        if (I18N_LANGUAGES[lang][key]) {
          els[i].innerHTML = I18N_LANGUAGES[lang][key];
        }
      }
      
      var titles = document.querySelectorAll('.section-title');
      for (var i = 0; i < titles.length; i++) {
        titles[i].setAttribute('data-text', titles[i].textContent);
      }
    }

    setLanguage(currentLang);

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        this.parentElement.classList.toggle('is-open');
      });
      document.addEventListener('click', function(e) {
        if (!toggleBtn.parentElement.contains(e.target)) {
          toggleBtn.parentElement.classList.remove('is-open');
        }
      });
    }

    for (var i = 0; i < menuBtnList.length; i++) {
      menuBtnList[i].addEventListener('click', function() {
        setLanguage(this.getAttribute('data-lang'));
        if (toggleBtn) toggleBtn.parentElement.classList.remove('is-open');
      });
    }
  }

  /* =======================================================================
     Misc: año en footer
     ======================================================================= */
  function setupYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* =======================================================================
     Merch Carousels
     ======================================================================= */
  function setupCarousels() {
    var containers = document.querySelectorAll('.merch-carousel-container');
    for (var i = 0; i < containers.length; i++) {
      (function(container) {
        var carousel = container.querySelector('.merch-carousel');
        var dots = container.querySelectorAll('.dot');
        var prevBtn = container.querySelector('.merch-arrow.prev');
        var nextBtn = container.querySelector('.merch-arrow.next');
        if (!carousel || dots.length === 0) return;
        
        function updateDots() {
          var scrollLeft = carousel.scrollLeft;
          var width = carousel.clientWidth;
          var index = Math.round(scrollLeft / width);
          for (var j = 0; j < dots.length; j++) {
            if (j === index) dots[j].classList.add('active');
            else dots[j].classList.remove('active');
          }
        }
        
        carousel.addEventListener('scroll', updateDots, { passive: true });
        
        function scrollToIdx(idx) {
          carousel.scrollTo({ left: idx * carousel.clientWidth, behavior: 'smooth' });
        }
        
        if (prevBtn) {
          prevBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var w = carousel.clientWidth;
            var curr = Math.round(carousel.scrollLeft / w);
            scrollToIdx(Math.max(0, curr - 1));
          });
        }
        if (nextBtn) {
          nextBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var w = carousel.clientWidth;
            var curr = Math.round(carousel.scrollLeft / w);
            scrollToIdx(Math.min(dots.length - 1, curr + 1));
          });
        }
        
        for (var k = 0; k < dots.length; k++) {
          (function(idx) {
            dots[idx].addEventListener('click', function(e) {
              e.stopPropagation();
              scrollToIdx(idx);
            });
          })(k);
        }
      })(containers[i]);
    }
  }

  /* =======================================================================
     Merch: Talla selector — inyecta <select> antes de botones con "talla"
     ======================================================================= */
  function setupMerchTallas() {
    var buyBtns = document.querySelectorAll('.merch-buy');
    toArray(buyBtns).forEach(function(btn) {
      var href = btn.getAttribute('href') || '';
      if (href.indexOf('talla') === -1) return; // Solo poleras (tienen "talla" en el URL)

      // Si ya tiene un select hermano, no duplicar
      if (btn.parentNode.querySelector('.merch-talla')) return;

      // Crear el <select>
      var sel = document.createElement('select');
      sel.className = 'merch-talla';
      sel.setAttribute('aria-label', 'Seleccionar talla');
      sel.innerHTML = '<option value="" disabled selected>Elige tu talla</option>' +
        '<option value="S">S</option>' +
        '<option value="M">M</option>' +
        '<option value="L">L</option>' +
        '<option value="XL">XL</option>' +
        '<option value="XXL">XXL</option>';
      btn.parentNode.insertBefore(sel, btn);

      // Interceptar el clic del botón para inyectar la talla
      btn.addEventListener('click', function(e) {
        var talla = sel.value;
        if (!talla) {
          e.preventDefault();
          sel.focus();
          sel.style.borderColor = 'var(--rust-bright)';
          setTimeout(function() { sel.style.borderColor = ''; }, 1500);
          return;
        }
        // Reemplazar "talla%20..." por "talla%20XL" (o la que sea)
        var newHref = href.replace('talla%20...', 'talla%20' + talla);
        btn.setAttribute('href', newHref);
      });
    });
  }

  /* =======================================================================
     Member Modal (Bio / Highlight)
     ======================================================================= */
  window.openMemberModal = function(card) {
    var modal = document.getElementById("member-modal");
    if (!modal) return;
    
    // Extraer data de la tarjeta
    var nameEl = card.querySelector(".name");
    var roleEl = card.querySelector(".role");
    var photoEl = card.querySelector(".member-photo img");
    var photoSvg = card.querySelector(".member-photo svg"); // fallback
    var bio = card.getAttribute("data-bio") || "Biografía no disponible.";
    
    // Elementos del modal
    var modalPhoto = document.getElementById("mm-photo");
    var modalName = document.getElementById("mm-name");
    var modalRole = document.getElementById("mm-role");
    var modalBio = document.getElementById("mm-bio");
    
    // Inyectar data
    if (nameEl) modalName.textContent = nameEl.textContent;
    if (roleEl) modalRole.textContent = roleEl.textContent;
    
    // Limpiar contenido bio y crear p
    modalBio.innerHTML = "";
    var p = document.createElement("p");
    p.textContent = bio;
    modalBio.appendChild(p);
    
    // Configurar foto
    if (photoEl) {
      modalPhoto.src = photoEl.src;
      modalPhoto.style.display = "block";
    } else {
      modalPhoto.style.display = "none";
    }
    
    // Mostrar modal
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; // Prevent scrolling
  };

  window.closeMemberModal = function() {
    var modal = document.getElementById("member-modal");
    if (!modal) return;
    
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = ""; // Restore scrolling
  };

  // Close modal on Escape key
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      window.closeMemberModal();
    }
  });

  /* =======================================================================
     Visual Overhaul: Preloader & Custom Cursor
     ======================================================================= */
  function setupVisualOverhaul() {
    // 1. Preloader
    window.addEventListener("load", function() {
      var preloader = document.getElementById("preloader");
      if (preloader) {
        setTimeout(function() {
          preloader.classList.add("hidden");
          setTimeout(function() {
            preloader.remove(); // Removed from DOM
          }, 500); // Wait for transition to finish
        }, 500); // 500ms minimum display time for the cool glitch
      }
    });

    // 2. Custom Cursor (magnetic effect)
    var cursor = document.getElementById("custom-cursor");
    if (cursor && window.matchMedia("(pointer: fine)").matches) {
      document.addEventListener("mousemove", function(e) {
        cursor.style.left = e.clientX + "px";
        cursor.style.top = e.clientY + "px";
      });

      var hoverElements = document.querySelectorAll("a, button, .member-card, .gallery-tile, .lb-nav, .lb-close, .member-modal-close, input, textarea");
      hoverElements.forEach(function(el) {
        el.addEventListener("mouseenter", function() {
          cursor.classList.add("hover");
        });
        el.addEventListener("mouseleave", function() {
          cursor.classList.remove("hover");
        });
      });
    }
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

  /* =======================================================================
     Ultra-Premium 3D Tilt Effect
     ======================================================================= */
  function setupTiltEffect() {
    var tiltCards = document.querySelectorAll(".merch-card, .member-card");
    if (!tiltCards.length || !window.matchMedia("(pointer: fine)").matches) return;

    toArray(tiltCards).forEach(function(card) {
      card.classList.add("tilt-card");
      card.addEventListener("mousemove", function(e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -10;
        var rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 10;
        card.style.transform = "perspective(1000px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg) scale3d(1.02, 1.02, 1.02)";
      });
      card.addEventListener("mouseleave", function() {
        card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      });
    });
  }

  /* =======================================================================
     Easter Egg: "THRASH"
     ======================================================================= */
  function setupEasterEgg() {
    var secretCode = "thrash";
    var inputBuffer = "";
    document.addEventListener("keydown", function(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      inputBuffer += e.key.toLowerCase();
      if (inputBuffer.length > secretCode.length) {
        inputBuffer = inputBuffer.substring(1);
      }
      if (inputBuffer === secretCode) {
        document.body.classList.add("thrash-mode");
        setTimeout(function() {
          document.body.classList.remove("thrash-mode");
        }, 3000);
        inputBuffer = "";
      }
    });
  }

  /* =======================================================================
     Paranoia Mode: Security Hardening
     ======================================================================= */
  function setupSecurity() {
    // Disable right click (context menu) globally
    document.addEventListener('contextmenu', function(e) {
      if(e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    });

    // Disable common DevTools shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
    document.addEventListener('keydown', function(e) {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
      }
      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'i' || e.key === 'j' || e.key === 'c')) {
        e.preventDefault();
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
      }
    });
  }

  /* =======================================================================
     Scroll Spy: Highlight active nav link
     ======================================================================= */
  function setupScrollSpy() {
    var sections = document.querySelectorAll("section, header.hero");
    var navLinks = document.querySelectorAll("[data-nav-link]");

    var spyObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute("id");
          if (!id) return;
          
          navLinks.forEach(function(link) {
            link.classList.remove("is-active");
            if (link.getAttribute("href") === "#" + id) {
              link.classList.add("is-active");
            }
          });
        }
      });
    }, { rootMargin: "-40% 0px -60% 0px" }); // Trigger when 50% of the section is visible

    sections.forEach(function(sec) {
      spyObserver.observe(sec);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    safe(setupSecurity);
    safe(setupEasterEgg);
    safe(setupScrollSpy);
    safe(setupTiltEffect);
    safe(renderShows);
    safe(renderGallery);
    safe(renderSpotify);
    safe(setupNav);
    safe(setupI18n);
    safe(setupReveal);
    safe(setupYear);
    safe(setupAmbientEffects);
    safe(setupLightbox);
    safe(setupGlitch);
    safe(autoMatchMemberPhotos);
    safe(renderVideos);
    safe(setupCarousels);
    safe(setupMerchTallas);
    safe(setupVisualOverhaul);
  });
  // -------------------------------------------------------------------------
  // PWA Service Worker Registration
  // -------------------------------------------------------------------------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('./sw.js').then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
        console.log('ServiceWorker registration failed: ', err);
      });
    });
  }

  /* =======================================================================
     Offline Mode Detection (PWA Toast)
     ======================================================================= */
  function showToast(message, type) {
    var container = document.getElementById('toast-container');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast ' + type;

    var iconSvg = type === 'offline' 
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="var(--rust)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>';

    toast.innerHTML = '<div class="toast-icon">' + iconSvg + '</div><span>' + message + '</span>';
    container.appendChild(toast);

    // Trigger reflow for animation
    void toast.offsetWidth;
    toast.classList.add('show');

    setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 400); // Wait for transition
    }, 4000); // Show for 4 seconds
  }

  window.addEventListener('offline', function() {
    showToast('Conexión Perdida. Modo Offline Activado.', 'offline');
  });

  window.addEventListener('online', function() {
    showToast('Conexión Restaurada.', 'online');
  });

})();
