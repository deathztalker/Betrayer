import createGlobe from 'https://esm.sh/cobe@latest';

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
var animFrameId = null;

// Focus state
var focusTarget = null;
var currentPhi = 0;
var currentTheta = 0.2;

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

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && globeModal.classList.contains('active')) {
      closeGlobe();
    }
  });
}

function closeGlobe() {
  globeModal.classList.remove('active');
  globeModal.setAttribute('aria-hidden', 'true');
  focusTarget = null;
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
    
    citiesList.sort(function(a, b) { return b.count - a.count; });
    renderCityList();
    
    // Delay init slightly so modal layout is complete
    requestAnimationFrame(function() {
      initGlobe();
    });
  }).catch(function(err) {
    console.error('Error fetching globe locations:', err);
    requestAnimationFrame(function() {
      initGlobe();
    });
  });
}

function initGlobe() {
  var size = canvas.offsetWidth || 500;
  
  canvas.style.cursor = 'grab';
  
  // Drag state
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
      currentTheta = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, currentTheta));
      
      startX = e.clientX;
      startY = e.clientY;
    }
  });

  // Create globe using cobe v2 API
  globeInstance = createGlobe(canvas, {
    devicePixelRatio: 2,
    width: size * 2,
    height: size * 2,
    phi: 0,
    theta: 0.2,
    dark: 0,
    diffuse: 1.2,
    mapSamples: 16000,
    mapBrightness: 6,
    baseColor: [1, 1, 1],
    markerColor: [0.8, 0.1, 0.1],
    glowColor: [1, 1, 1],
    markers: markers,
    offset: [0, 0],
    scale: 1,
  });

  // Animate using requestAnimationFrame + globe.update() (cobe v2 pattern)
  function animate() {
    if (isDragging) {
      // Drag controls phi/theta via pointermove events
    } else if (focusTarget) {
      var targetPhi = Math.PI - (focusTarget.lng * Math.PI / 180) - Math.PI / 2;
      var targetTheta = focusTarget.lat * Math.PI / 180;
      currentPhi += (targetPhi - currentPhi) * 0.05;
      currentTheta += (targetTheta - currentTheta) * 0.05;
    } else {
      currentPhi += 0.005;
      currentTheta += (0.2 - currentTheta) * 0.05;
    }
    
    globeInstance.update({ phi: currentPhi, theta: currentTheta });
    animFrameId = requestAnimationFrame(animate);
  }
  
  animate();
}
