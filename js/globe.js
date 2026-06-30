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

// Tooltip element
var tooltip = null;

if (globeBtn && globeModal && canvas) {
  // Create tooltip element
  tooltip = document.createElement('div');
  tooltip.className = 'globe-tooltip';
  tooltip.style.display = 'none';
  canvas.parentElement.appendChild(tooltip);

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
  if (tooltip) tooltip.style.display = 'none';
}

function showTooltip(city) {
  if (!tooltip) return;
  tooltip.innerHTML = '<span class="tooltip-dot"></span><strong>' + city.name + '</strong><span class="tooltip-count">' + city.count + ' visita' + (city.count !== 1 ? 's' : '') + '</span>';
  tooltip.style.display = 'flex';
  
  // Auto-hide after 4 seconds
  clearTimeout(tooltip._timer);
  tooltip._timer = setTimeout(function() {
    tooltip.style.display = 'none';
  }, 4000);
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
      showTooltip(city);
      
      // Highlight active city
      var allItems = cityListEl.querySelectorAll('li');
      allItems.forEach(function(item) { item.classList.remove('active'); });
      li.classList.add('active');
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
            
            var size = Math.min(0.12, 0.04 + (count * 0.008));
            markers.push({ location: [lat, lng], size: size, color: [1, 0.1, 0.1] });
            
            citiesList.push({ name: name, count: count, lat: lat, lng: lng });
          }
        }
      }
    }
    
    citiesList.sort(function(a, b) { return b.count - a.count; });
    renderCityList();
    
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
    if (tooltip) tooltip.style.display = 'none';
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

  // Cyberpunk dark globe 
  globeInstance = createGlobe(canvas, {
    devicePixelRatio: 2,
    width: size * 2,
    height: size * 2,
    phi: 0,
    theta: 0.2,
    dark: 1,
    diffuse: 1.2,
    mapSamples: 25000,
    mapBrightness: 6,
    baseColor: [0.3, 0.3, 0.3],
    markerColor: [1, 0.1, 0.1],
    glowColor: [0.15, 0.02, 0.02],
    markers: markers,
    offset: [0, 0],
    scale: 1.15,
  });

  // Animate using cobe v2 API
  function animate() {
    if (isDragging) {
      // Drag controls phi/theta via pointermove
    } else if (focusTarget) {
      var targetPhi = Math.PI - (focusTarget.lng * Math.PI / 180);
      var targetTheta = focusTarget.lat * Math.PI / 180;
      // Clamp theta so globe doesn't tilt out of view
      targetTheta = Math.max(-0.6, Math.min(0.6, targetTheta));
      currentPhi += (targetPhi - currentPhi) * 0.06;
      currentTheta += (targetTheta - currentTheta) * 0.06;
    } else {
      currentPhi += 0.005;
      currentTheta += (0.2 - currentTheta) * 0.05;
    }
    
    globeInstance.update({ phi: currentPhi, theta: currentTheta });
    animFrameId = requestAnimationFrame(animate);
  }
  
  animate();
}
