var map, popup, Popup, markers = [];
const elements = {
    map: document.getElementById('map'),
    /*
    options: {
        year: document.getElementById('option-year'),
        pan: document.getElementById('option-pan'),
        precedence: document.getElementById('option-precedence'),
    }
    */
};

var panToMarkers = true;
var popupOpen = false;

// Called by Maps API upon loading.
function initMap() {
    definePopupClass();

    map = new google.maps.Map(elements.map, { // Define Map Settings
        center: {
            lat: 35,
            lng: -98
        },
        zoom: 4,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        backgroundColor: '#333333',
        styles: mapStyles
    });

    elements.map.classList.remove('loading');
    if (yearDocuments.get(year).formURL) {
        elements.submitDestination.submitLink.href =
            yearDocuments.get(year).formURL;
        elements.submitDestination.submitYear.textContent = year;
    }
}

function clearPopups() {
    if (popup) popup.setMap(null);
}

function buildInstitutionData(year) {
    var institutions = {};
    for (student of students.get(year)) {
        if (!institutions[student['Institution name']]) { // If the institution isn't already in the object
            if (!coordinates.has(student['Institution name'])) {
                console.error('No location data found for Institution: ' + student['Institution name']);
            }

            institutions[student['Institution name']] = {
                name: student['Institution name'],
                students: [],
                position: coordinates.get(student['Institution name']),
            }
        }
        institutions[student['Institution name']].students.push({
            name: student['First name'] + ' ' + student['Last name'],
            major: student['Intended major(s) or field(s) of study'],
        });
    }

    for ([ institutionName, logoURL ] of logos) {
        if (institutions[institutionName]) {
            institutions[institutionName].logo = logoURL;
        }
    }

    return institutions;
}

function placeMarkers(institutions) {
    clearMarkers();

    for (name in institutions) {
        let marker = new google.maps.Marker(institutions[name]);
        google.maps.event.addListener(marker, 'click', function() {
            details(this);

            if (panToMarkers) {
                var scale = 1 / (1 << map.getZoom());
                var worldCoordinate = map.getProjection().fromLatLngToPoint(marker.position);
                var defaultOffset = 80 * scale;
                var offsetPerStudent = 40 * scale;

                worldCoordinate.y -= defaultOffset +
                    (offsetPerStudent * Math.min(5, this.students.length));
                worldCoordinate.y = Math.max(0, worldCoordinate.y);

                var latLng = map.getProjection().fromPointToLatLng(worldCoordinate);
                map.panTo(latLng);
            }
        });
        marker.setMap(map);
        markers.push(marker);
    }
    setMarkerPrecedence(elements.options.precedence.value == 'Bottom');
}

function clearMarkers() {
    for (marker of markers) {
        marker.setMap(null);
    }
    markers = [];
}

function details(institution) {
    clearPopups();
    var info = document.createElement('div');
    popup = new Popup(new google.maps.LatLng(institution.position.lat(), institution.position.lng()), info);
    popup.setMap(map);
    console.log('Adding popup');
    popupOpen = true;
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

function transitionEnd(element, transitionProperty) {
    return new Promise(function(resolve, _) {
        var callback = function(event) {
            if (event.propertyName === transitionProperty) {
                element.removeEventListener('transitionend', callback);
                resolve();
            }
        };
        element.addEventListener('transitionend', callback);
    });
}

var mapStyles = [
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{
            color: '#222222'
        }]
    },
    {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{
            color: '#444444'
        }]
    },
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [
            {
                color: '#444444'
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
            color: '#666666'
        }]
    },
    {
        elementType: 'labels.text.stroke',
        stylers: [
            {
                visibility: 'on'
            },
            {
                color: '#666666'
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
            color: '#ffffff'
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
                color: '#444444'
            }
        ]
    },
    {
        featureType: 'administrative.country',
        elementType: 'geometry',
        stylers: [{
            color: '#d12727'
        }]
    },
    {
        featureType: 'administrative.province',
        elementType: 'geometry',
        stylers: [{
            color: '#d12727'
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
            color: '#333333'
        }]
    },
    {
        featureType: 'poi.school',
        elementType: 'geometry',
        stylers: [{
            color: '#d12727'
        }]
    }
];
