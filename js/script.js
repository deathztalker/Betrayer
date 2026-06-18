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
    "assets/gallery/central-bar-01.jpg",
    "assets/gallery/central-bar-03.jpg",
    "assets/gallery/central-bar-02.jpg"
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
    var cacheKey = "betrayer_gh_" + path;
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
            .filter(function (f) { return /\.(jpe?g|png|webp|gif|mp4|webm)$/i.test(f.name); })
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
    html += '<p class="flyer-bill" style="border-top:none;padding-top:.4rem">Síguenos en Instagram y Facebook para enterarte de nuevas tocatas.</p>';
    html += "</article>";

    board.innerHTML = html;
  }

  /* =======================================================================
     Render: GALERÍA — auto-descubre fotos desde GitHub API
     ======================================================================= */
  function renderGallery() {
    var grid = document.querySelector("[data-gallery-grid]");
    if (!grid) return;

    // intentar auto-descubrir desde GitHub, con GALLERY como respaldo
    fetchGitHubDir("assets/gallery", function (discovered) {
      var photos = (discovered && discovered.length) ? discovered : GALLERY;
      // si descubrimos fotos nuevas, actualizar GALLERY para el lightbox
      if (discovered && discovered.length) GALLERY = discovered;
      fillGalleryGrid(grid, photos);
    });

    // mostrar el respaldo inmediatamente mientras carga la API
    fillGalleryGrid(grid, GALLERY);
  }

  function fillGalleryGrid(grid, photos) {
    var total = Math.max(photos.length, GALLERY_MIN_TILES);
    var html = "";
    for (var i = 0; i < total; i++) {
      if (photos[i]) {
        html += '<div class="gallery-tile"><img src="' + photos[i] + '" alt="Betrayer en vivo" loading="lazy"></div>';
      } else {
        html += '<div class="gallery-tile is-empty">' + svgIcon("camera") + "</div>";
      }
    }
    grid.innerHTML = html;
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
     Ember / spark particle system (hero canvas)
     ======================================================================= */
  function setupParticles() {
    var hero = document.querySelector(".hero");
    var canvas = document.querySelector(".hero-particles");
    if (!hero || !canvas) return;

    // respect reduced motion
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var ctx = canvas.getContext("2d");
    var particles = [];
    var MAX_PARTICLES = 55;
    var isVisible = true;
    var animId;

    var COLORS = [
      { r: 163, g: 28,  b: 28  },  // blood bright
      { r: 181, g: 87,  b: 31  },  // rust
      { r: 211, g: 114, b: 47  },  // rust bright
      { r: 230, g: 150, b: 60  },  // warm orange
      { r: 200, g: 50,  b: 30  },  // hot red
      { r: 255, g: 180, b: 80  },  // ember yellow
    ];

    function resize() {
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function createParticle() {
      var color = COLORS[Math.floor(Math.random() * COLORS.length)];
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 40,
        size: Math.random() * 2.8 + 0.8,
        speedY: -(Math.random() * 1.2 + 0.4),
        speedX: (Math.random() - 0.5) * 0.6,
        wobbleAmp: Math.random() * 0.5 + 0.2,
        wobbleSpeed: Math.random() * 0.03 + 0.01,
        wobbleOffset: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.6 + 0.4,
        life: 0,
        maxLife: Math.random() * 220 + 100,
        color: color,
        tick: 0
      };
    }

    // seed particles
    for (var i = 0; i < MAX_PARTICLES; i++) {
      var p = createParticle();
      p.y = Math.random() * canvas.height;
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    function animate() {
      if (!isVisible) { animId = requestAnimationFrame(animate); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.tick++;
        p.life++;
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.tick * p.wobbleSpeed + p.wobbleOffset) * p.wobbleAmp;

        // fade in at start, fade out at end
        var lifeRatio = p.life / p.maxLife;
        var alpha = p.opacity;
        if (lifeRatio < 0.1) alpha *= lifeRatio / 0.1;
        if (lifeRatio > 0.7) alpha *= (1 - lifeRatio) / 0.3;

        if (p.life >= p.maxLife || p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
          particles[i] = createParticle();
          continue;
        }

        // draw ember with glow
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = p.size * 6;
        ctx.shadowColor = "rgba(" + p.color.r + "," + p.color.g + "," + p.color.b + ",0.6)";
        ctx.fillStyle = "rgba(" + p.color.r + "," + p.color.g + "," + p.color.b + "," + alpha + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(animate);
    }

    // only animate when hero is in viewport
    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(function (entries) {
        isVisible = entries[0].isIntersecting;
      }, { threshold: 0 });
      obs.observe(hero);
    }

    animate();
  }

  /* =======================================================================
     Gallery lightbox
     ======================================================================= */
  function setupLightbox() {
    var lightbox = document.querySelector("[data-lightbox]");
    var lbImg = document.querySelector("[data-lightbox-img]");
    var lbClose = document.querySelector("[data-lightbox-close]");
    var lbPrev = document.querySelector("[data-lightbox-prev]");
    var lbNext = document.querySelector("[data-lightbox-next]");
    var lbCounter = document.querySelector("[data-lightbox-counter]");
    if (!lightbox || !lbImg) return;

    var currentIndex = 0;
    var realPhotos = GALLERY.filter(function (src) { return !!src; });

    function open(index) {
      if (!realPhotos.length) return;
      currentIndex = index;
      lbImg.src = realPhotos[currentIndex];
      if (lbCounter) lbCounter.textContent = (currentIndex + 1) + " / " + realPhotos.length;
      lightbox.classList.add("is-active");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function close() {
      lightbox.classList.remove("is-active");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    function next() {
      currentIndex = (currentIndex + 1) % realPhotos.length;
      lbImg.src = realPhotos[currentIndex];
      if (lbCounter) lbCounter.textContent = (currentIndex + 1) + " / " + realPhotos.length;
    }

    function prev() {
      currentIndex = (currentIndex - 1 + realPhotos.length) % realPhotos.length;
      lbImg.src = realPhotos[currentIndex];
      if (lbCounter) lbCounter.textContent = (currentIndex + 1) + " / " + realPhotos.length;
    }

    // click on gallery tiles
    var grid = document.querySelector("[data-gallery-grid]");
    if (grid) {
      grid.addEventListener("click", function (e) {
        var tile = e.target.closest(".gallery-tile:not(.is-empty)");
        if (!tile) return;
        var img = tile.querySelector("img");
        if (!img) return;
        var idx = realPhotos.indexOf(img.getAttribute("src"));
        if (idx >= 0) open(idx);
      });
    }

    if (lbClose) lbClose.addEventListener("click", close);
    if (lbPrev) lbPrev.addEventListener("click", prev);
    if (lbNext) lbNext.addEventListener("click", next);

    // click outside image to close
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox || e.target.classList.contains("lightbox-img-wrap")) close();
    });

    // keyboard controls
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-active")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    });
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
    safe(setupI18n);
    safe(setupReveal);
    safe(setupYear);
    safe(setupParticles);
    safe(setupLightbox);
    safe(setupGlitch);
    safe(autoMatchMemberPhotos);
    safe(renderVideos);
  });
})();
