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
  // Match official cobe example: canvas style=500x500, attribute width/height=1000
  var dpr = window.devicePixelRatio || 2;
  var size = canvas.offsetWidth || 500;
  
  // Set canvas buffer size for retina
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  
  canvas.style.cursor = 'grab';
  
  var isDragging = false;
  var startX = 0;
  var startY = 0;
  
  canvas.addEventListener('pointerdown', function(e) {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    canvas.style.cursor = 'grabbing';
    focusTarget = null;
  });
  
  window.addEventListener('pointerup', function() {
    isDragging = false;
    if (canvas) canvas.style.cursor = 'grab';
  });
  
  window.addEventListener('pointermove', function(e) {
    if (isDragging) {
      var deltaX = e.clientX - startX;
      var deltaY = e.clientY - startY;
      
      currentPhi -= deltaX * 0.008; 
      currentTheta -= deltaY * 0.008;
      currentTheta = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, currentTheta));
      
      startX = e.clientX;
      startY = e.clientY;
    }
  });

  // Exact config from official cobe README, with dark:0
  globeInstance = createGlobe(canvas, {
    devicePixelRatio: dpr,
    width: size * dpr,
    height: size * dpr,
    phi: 0,
    theta: 0,
    dark: 0,
    diffuse: 1.2,
    scale: 1,
    mapSamples: 16000,
    mapBrightness: 6,
    baseColor: [0.3, 0.3, 0.3],
    markerColor: [1, 0.5, 1],
    glowColor: [1, 1, 1],
    offset: [0, 0],
    markers: markers,
    onRender: function(state) {
      if (isDragging) {
        // Drag controls phi/theta via pointermove
      } else if (focusTarget) {
        var targetPhi = Math.PI - (focusTarget.lng * Math.PI / 180) - Math.PI / 2;
        var targetTheta = focusTarget.lat * Math.PI / 180;
        currentPhi += (targetPhi - currentPhi) * 0.05;
        currentTheta += (targetTheta - currentTheta) * 0.05;
      } else {
        currentPhi += 0.01;
        currentTheta += (0 - currentTheta) * 0.05; 
      }
      
      state.phi = currentPhi;
      state.theta = currentTheta;
    }
  });
}
