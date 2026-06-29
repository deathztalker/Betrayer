import createGlobe from 'https://esm.sh/cobe';

var globeBtn = document.getElementById('globe-btn');
var globeModal = document.getElementById('globe-modal');
var globeOverlay = document.getElementById('globe-overlay');
var globeClose = document.getElementById('globe-close');
var canvas = document.getElementById('globe-canvas');
var cityListEl = document.getElementById('globe-city-list');

var globeInstance = null;
var hasLoaded = false;
var markers = [];
var citiesList = [];

// Focus state
var focusTarget = null;
var currentPhi = 0;
var currentTheta = 0;

if (globeBtn && globeModal && canvas) {
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
}

function closeGlobe() {
  globeModal.classList.remove('active');
  globeModal.setAttribute('aria-hidden', 'true');
  focusTarget = null; // reset focus
}

function renderCityList() {
  if (!cityListEl) return;
  cityListEl.innerHTML = '';
  
  if (citiesList.length === 0) {
    cityListEl.innerHTML = '<li class="empty-state">No hay visitas registradas aún.</li>';
    return;
  }
  
  citiesList.forEach(function(city) {
    var li = document.createElement('li');
    li.style.cursor = 'pointer';
    li.innerHTML = '<span class="city-name">' + city.name + '</span><span class="city-count">' + city.count + '</span>';
    
    // Al hacer clic, hacemos focus en el globo
    li.addEventListener('click', function() {
      focusTarget = { lat: city.lat, lng: city.lng };
    });
    
    cityListEl.appendChild(li);
  });
}

function loadGlobeData() {
  var db = firebase.firestore();
  db.collection('site').doc('stats').get().then(function(doc) {
    if (doc.exists) {
      var data = doc.data();
      if (data.locations) {
        for (var key in data.locations) {
          var parts = key.split(',');
          if (parts.length === 2) {
            var lat = parseFloat(parts[0]);
            var lng = parseFloat(parts[1]);
            var locData = data.locations[key];
            
            var count = 0;
            var name = "Ubicación Desconocida";
            
            if (typeof locData === 'number') {
              count = locData;
            } else {
              count = locData.count || 0;
              name = locData.name || name;
            }
            
            var size = Math.min(0.15, 0.05 + (count * 0.01));
            markers.push({ location: [lat, lng], size: size });
            
            citiesList.push({ name: name, count: count, lat: lat, lng: lng });
          }
        }
      }
    }
    
    // Sort cities by count descending
    citiesList.sort(function(a, b) { return b.count - a.count; });
    renderCityList();
    
    initGlobe();
  }).catch(function(err) {
    console.error('Error fetching globe locations:', err);
    initGlobe();
  });
}

function initGlobe() {
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
    baseColor: [0.3, 0.3, 0.3], 
    markerColor: [0.8, 0.1, 0.1], 
    glowColor: [1, 1, 1],
    markers: markers,
    onRender: function(state) {
      if (focusTarget) {
        // Enfoque a una ciudad específica
        var targetPhi = Math.PI - focusTarget.lng * Math.PI / 180 - Math.PI / 2;
        var targetTheta = focusTarget.lat * Math.PI / 180;
        
        // Easing (transición suave) hacia el punto
        currentPhi += (targetPhi - currentPhi) * 0.05;
        currentTheta += (targetTheta - currentTheta) * 0.05;
      } else {
        // Rotación libre por defecto (aumentado para que se note)
        currentPhi += 0.01;
        // Si theta estaba en otro ángulo, lo devolvemos suavemente al centro (0)
        currentTheta += (0 - currentTheta) * 0.05; 
      }
      
      state.phi = currentPhi;
      state.theta = currentTheta;
    }
  });
}
