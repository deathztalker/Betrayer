(function() {
  var globeBtn = document.getElementById('globe-btn');
  var globeModal = document.getElementById('globe-modal');
  var globeOverlay = document.getElementById('globe-overlay');
  var globeClose = document.getElementById('globe-close');
  var canvas = document.getElementById('globe-canvas');
  var globeInstance = null;
  var hasLoaded = false;
  var markers = [];

  if (!globeBtn || !globeModal || !canvas) return;

  function closeGlobe() {
    globeModal.classList.remove('active');
    globeModal.setAttribute('aria-hidden', 'true');
  }

  globeBtn.addEventListener('click', function() {
    globeModal.classList.add('active');
    globeModal.setAttribute('aria-hidden', 'false');
    
    if (!hasLoaded) {
      loadGlobeData();
      hasLoaded = true;
    }
  });

  globeClose.addEventListener('click', closeGlobe);
  globeOverlay.addEventListener('click', closeGlobe);

  // Esc keys to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && globeModal.classList.contains('active')) {
      closeGlobe();
    }
  });

  function loadGlobeData() {
    var db = firebase.firestore();
    db.collection('site').doc('stats').get().then(function(doc) {
      if (doc.exists) {
        var data = doc.data();
        if (data.locations) {
          // Parse locations map {"lat,lng": count}
          for (var key in data.locations) {
            var parts = key.split(',');
            if (parts.length === 2) {
              var lat = parseFloat(parts[0]);
              var lng = parseFloat(parts[1]);
              var count = data.locations[key];
              // Cap size between 0.05 and 0.15 based on counts
              var size = Math.min(0.15, 0.05 + (count * 0.01));
              markers.push({ location: [lat, lng], size: size });
            }
          }
        }
      }
      initGlobe();
    }).catch(function(err) {
      console.error('Error fetching globe locations:', err);
      initGlobe(); // Initialize even without markers
    });
  }

  function initGlobe() {
    if (!window.createGlobe) {
      // In case CDN is slow, wait and retry
      setTimeout(initGlobe, 500);
      return;
    }

    var phi = 0;
    
    // Configuración para que el canvas se vea bien en pantallas retina (doble tamaño interno)
    var dpr = window.devicePixelRatio || 1;
    var width = canvas.offsetWidth;
    var height = canvas.offsetHeight;
    
    globeInstance = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: width * dpr,
      height: height * dpr,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.1, 0.1, 0.1], // Oscuro / Metal
      markerColor: [0.8, 0.1, 0.1], // Rojo Betrayer
      glowColor: [0.1, 0.1, 0.1],
      markers: markers,
      onRender: function(state) {
        // Rotación lenta
        state.phi = phi;
        phi += 0.003;
      }
    });

  }
})();
