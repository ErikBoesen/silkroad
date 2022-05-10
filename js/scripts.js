var map, popup, Popup, markers = [];
const elements = {
    preloader: document.getElementById('preloader'),
    map: document.getElementById('map'),
    audio: document.getElementById('audio'),
    audioButton: document.getElementById('audio_button'),
    main: document.getElementsByTagName('main')[0],
    aside: document.getElementsByTagName('aside')[0],
    title: document.getElementById('title'),
    description: document.getElementById('description'),
};

var panToMarkers = true;
var popupOpen = false;

const ACCENT = '#2986cc',
      SHADE_1 = '#222222',
      SHADE_2 = '#333333',
      SHADE_3 = '#444444',
      SHADE_4 = '#666666',
      WRITING = '#ffffff';

const MAP_STYLES = [
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{
            color: SHADE_1
        }]
    },
    {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{
            color: SHADE_3
        }]
    },
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [
            {
                color: SHADE_3
            },
            {
                lightness: -37
            }
        ]
    },
    {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [{
            color: SHADE_4
        }]
    },
    {
        elementType: 'labels.text.stroke',
        stylers: [
            {
                visibility: 'on'
            },
            {
                color: SHADE_4
            },
            {
                weight: 2
            },
            {
                gamma: 0.84
            }
        ]
    },
    {
        elementType: 'labels.text.fill',
        stylers: [{
            color: WRITING
        }]
    },
    {
        featureType: 'administrative',
        elementType: 'geometry',
        stylers: [
            {
                weight: 0.6
            },
            {
                color: SHADE_3
            }
        ]
    },
    {
        featureType: 'administrative.country',
        elementType: 'geometry',
        stylers: [{
            color: ACCENT
        }]
    },
    {
        featureType: 'administrative.province',
        elementType: 'geometry',
        stylers: [{
            color: ACCENT
        }]
    },
    {
        elementType: 'labels.icon',
        stylers: [{
            visibility: 'off'
        }]
    },
    {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{
            color: SHADE_2
        }]
    },
    {
        featureType: 'poi.school',
        elementType: 'geometry',
        stylers: [{
            color: ACCENT
        }]
    }
];

// Called by Maps API upon loading.
function initMap() {
    definePopupClass();

    map = new google.maps.Map(elements.map, { // Define Map Settings
        center: {
            lat: 38,
            lng: 78
        },
        zoom: 4,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        backgroundColor: '#333333',
        styles: MAP_STYLES,
    });

    Promise.all([
        getSites(),
    ]).then(function() {
        setTimeout(function() {
            document.body.classList.remove('loading');
        }, 800);
    });
}

async function getSites() {
    return fetch('/sites.json')
        .then(request => request.json())
        .then(sites => {
            placeMarkers(sites);
        });
}

function clearPopups() {
    if (popup) popup.setMap(null);
    elements.main.classList.remove('open');
}

function placeMarkers(sites) {
    for (let site of sites) {
        let marker = new google.maps.Marker({
            position: new google.maps.LatLng(site.lat, site.lng),
            title: site.location,
        });
        marker.site = site;
        google.maps.event.addListener(marker, 'click', function() {
            openMarker(this);

            if (panToMarkers) {
                var scale = 1 / (1 << map.getZoom());
                var worldCoordinate = map.getProjection().fromLatLngToPoint(marker.position);
                var defaultOffset = 80 * scale;
                var offsetPerStudent = 40 * scale;

                worldCoordinate.y -= defaultOffset +
                    (offsetPerStudent * Math.min(5, sites.length));
                worldCoordinate.y = Math.max(0, worldCoordinate.y);

                var latLng = map.getProjection().fromPointToLatLng(worldCoordinate);
                map.panTo(latLng);
            }

            elements.main.classList.add('open');
        });
        marker.setMap(map);
        markers.push(marker);
    }
}

function openMarker(marker) {
    clearPopups();
    // Create popup
    var info = document.createElement('div');
    popup = new Popup(new google.maps.LatLng(marker.position.lat(), marker.position.lng()), info);
    popup.setMap(map);
    popupOpen = true;

    // Create sidebar content
    elements.title.textContent = marker.site.location;
    elements.description.textContent = '';
    for (let piece of marker.site.art) {
        let img = document.createElement('img');
        img.src = '/img/art/' + piece.image;
        elements.description.append(img);
        let p = document.createElement('p');
        p.textContent = piece.text;
        elements.description.append(p);
    }

    // Set music
    elements.audio.pause()
    elements.audio.src = '/audio/' + marker.site.culture.toLowerCase().replace(' ', '_') + '.mp3';
    elements.audio.play()
}

var dragged = false;
var touchStartPositon = null;

onmousedown = onDragReset;
ontouchstart = onDragReset;

onmousemove = onDragStart;
ontouchmove = onDragStart;

onmouseup = onDragEnd;
ontouchend = onDragEnd;

function onDragReset(e) {
    dragged = false;
    if (e.touches) {
        touchStartPositon = [ e.touches[0].screenX, e.touches[0].screenY ];
    }
}

function onDragStart(e) {
    if (!touchStartPositon || !e.touches || e.touches.length < 1
        || Math.sqrt(Math.pow(touchStartPositon[0] - e.touches[0].screenX, 2)
            + Math.pow(touchStartPositon[1] - e.touches[0].screenY, 2)) > 50) {
        dragged = true;
    }
}

function onDragEnd(e) {
    // Check that we're not clicking a marker and that there was no dragging
    if (e.target.tagName != 'IMG'
        && dragged == false) {
        clearPopups();
    }
    dragged = false;
    touchStartPositon = null;
}

onkeydown = function(e) {
    if (e.key === 'Escape') {
        clearPopups();
    }
}

elements.audioButton.onclick = function() {
    if (elements.audio.muted) {
        elements.audio.muted = false;
        elements.audioButton.src = '/img/speaker.svg';
    } else {
        elements.audio.muted = true;
        elements.audioButton.src = '/img/speaker_muted.svg';
    }
}
