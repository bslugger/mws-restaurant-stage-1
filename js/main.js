let restaurants,
  neighborhoods,
  cuisines;
let map;
let markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  registerServiceWorker();

  // Place the script in the head if there is online access, otherwise
  // call the function that would have been executed in the script's callback
  if( navigator.onLine ){
    const script = document.createElement('script');
    script.src = '//maps.googleapis.com/maps/api/js?key=AIzaSyDEzTdwKnrAUxK8CHLf8lWcDC-dgI3QiYk&libraries=places&callback=initMap';
    script.async = false;
    script.defer = true;
    document.head.appendChild(script);
  } else {
    updateRestaurants();
  }
});


/**
 * Fetch the script that installs the service worker
 */
registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    // Register a service worker hosted at the root of the
    // site using the default scope.
    navigator.serviceWorker.register('/js/sw/sw.js').then( registration => {
      console.log('Service worker registration succeeded:', registration);
    }, /*catch*/ error => {
      console.log('Service worker registration failed:', error);
    });
  } else {
    console.log('Service workers are not supported.');
  }
}


/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };

  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false,
    title: "Restaurant reviews for New York City"
  });

  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  cSelect.setAttribute('aria-activedescendant', cuisine);
  nSelect.setAttribute('aria-activedescendant', neighborhood);

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(m => m.setMap(null));
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  if( navigator.onLine ){
    addMarkersToMap();
  }
}

/**
 * Create restaurant HTML as its own list item, with responsive images
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const picture = document.createElement('picture');

  const sourceLarge = document.createElement('source');
  sourceLarge.media = "(min-width: 960px)";
  sourceLarge.srcset = DBHelper.imageSourceLargeForRestaurant(restaurant);

  const sourceMedium = document.createElement('source');
  sourceMedium.media = "(max-width: 960px)";
  sourceMedium.srcset = DBHelper.imageSourceMediumForRestaurant(restaurant);

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = DBHelper.imageAltText(restaurant);

  // nest responsive images inside picture element
  picture.append(sourceLarge);
  picture.append(sourceMedium);
  picture.append(image);
  li.append(picture);

  const name = document.createElement('h1');
  const link = document.createElement('a');
  link.className = "restaurant-link";
  link.innerHTML = restaurant.name;
  link.href = DBHelper.urlForRestaurant(restaurant);
  
  name.append(link);
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
