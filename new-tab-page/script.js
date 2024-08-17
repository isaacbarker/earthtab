let index = 5;
let data;
let transition = false;

// fetch images from NASA API
async function fetchImg() {

    // fetch data from NASA api
    data = await fetch("https://epic.gsfc.nasa.gov/api/natural")
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            } else {
                return response.json();
            }
        })

    // begin pre downloading images
    for (let i = 0; i < data.length; i++) {
        const url = getURL(data[i]);
        new Image().src = url;
    }
  
    // work out closest image to user's geo-location
    if (navigator.geolocation) {
        pos = await navigator.geolocation.getCurrentPosition(
            position => {
                let lat = position.coords.latitude;
                let lon = position.coords.longitude;

                const imgPositions = data.map(image => {
                    return image.coords.centroid_coordinates;
                })

                // find distance from user to centroid location
                let minDist = Infinity;

                for (let i = 0; i < imgPositions.length; i++) {
                    const dist = haversineDistance(lat, lon, imgPositions[i].lat, imgPositions[i].lon)

                    if (dist < minDist) {
                        minDist = dist;
                        index = i;
                    }
                }
                
                slideshow();
                
            },
            error => {
                slideshow();
            }
        )
    } else {
        slideshow();
    }
}

fetchImg();

// calculate haversine distance for best image finder
function haversineDistance(lat1, lon1, lat2, lon2) {
    const r = 6.371e6;
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    // solve for d = 2rarcsin(a)
    const a = Math.sqrt(
        (1 - Math.cos(degreesToRadians(dLat)) + Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) * (1 - Math.cos(degreesToRadians(dLon)))) / 2
    )

    return d = 2*r*Math.asin(a);
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// url builder for NASA API
function getURL(image) {

    const date = new Date(image.date);
    return `https://epic.gsfc.nasa.gov/archive/natural/${date.getUTCFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/jpg/${image.image}.jpg`;   
}

// operate slideshow system
function slideshow() {
    // fetch image url
    const image = data[index];
    const url = getURL(image);

    // set image
    const imageElement = new Image();
    imageElement.src = url;
    imageElement.classList.add('bg__img');
    imageElement.alt = image.caption;
    imageElement.decode().then(() => {    
        
        const background = document.getElementById('bg');

        // remove current image if present
        if (background.children.length > 0) {
            background.firstElementChild.remove();
        }

        background.appendChild(imageElement);
        document.getElementById('caption').innerHTML = image.caption;

        // reset transition status
        transition = false;
    })

}

// mouse scroll event
addEventListener('wheel', e => {
    let dist = e.deltaY;

    // prevent running if images aren't loaded
    if (!data) {
        return;
    }

    if (dist > 5 && !transition) {
        // update slideshow index
        index += 1;
        if (index >= data.length) {
            index = 0;
        }

        // run next slide and update transition status
        transition = true;
        slideshow()
    } else if (dist < -5 && !transition) {
        // update slideshow index
        index -= 1;
        if (index < 0) {
            index = data.length - 1;
        }
        
        // run next slide and update transition status
        transition = true;
        slideshow()
    }


})

// google search form
document.getElementById("search").addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('search__input').value;
    window.location.replace(`https://www.google.com/search?q=${input}`);
})