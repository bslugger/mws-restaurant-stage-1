/* Concatenating all js files */
/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337;
    return `http://localhost:${port}/restaurants`
  }

  static get DATABASE_REVIEWS_URL() {
    const port = 1337;
    return `http://localhost:${port}/reviews`
  }

  static updateFavorite(isFavorite, restaurantId) {
    let url  = '';
    let requestBody = '';
    console.log(restaurantId);
    console.log(isFavorite);
    if (isFavorite === false) {
      url = DBHelper.DATABASE_URL+'/'+restaurantId+'/?is_favorite=true'
      requestBody = {"is_favorite": true};
    } else {
      url = DBHelper.DATABASE_URL+'/'+restaurantId+'/?is_favorite=false'
      requestBody = {"is_favorite": false};
    }

    const faveRequest = new Request( url , {
      method: 'POST',
      body: requestBody
    });

    fetch(faveRequest).then( function(response){
      if(response.ok){
        response.json().then(function(json){
          console.log(json);
          const el = document.getElementById('star-'+restaurantId);
          if (json.is_favorite == "true") {
            el.classList.remove('far');
            el.classList.add('fas');
            updateRestaurant(json);
          } else {
            el.classList.remove('fas');
            el.classList.add('far');
            updateRestaurant(json);
          }
        })
      }
    });

  }

  static addReview(reviewForm, restaurantId) {
    let url  = DBHelper.DATABASE_REVIEWS_URL+'/?restaurant_id='+restaurantId;
    let requestBody = '';

    console.log(reviewForm);
    console.log(restaurantId);

    const reviewRequest = new Request( url , {
      method: 'POST',
      body: reviewForm
    });

    fetch(reviewRequest).then( function(response) {
      if(response.ok){
        response.json().then(function(json){

          json.comments = reviewForm.comments;
          json.name = reviewForm.name;
          json.rating = reviewForm.rating;
          json.restaurant_id = reviewForm.restaurant_id;
          console.log(json);

          dbPromise.then(function(db) {
            var tx = db.transaction('reviews', 'readwrite');
            var reviewsStore = tx.objectStore('reviews');
            reviewsStore.put(json); 
            return tx.complete;
          }).then( () => {
            console.log('Review added');
          });
        })
      }
    });

  }

  /**
   * Fetch all favorite restaurants.
   */
  static fetchFavorites(restaurant) {
    fetch(DBHelper.DATABASE_URL+"/?is_favorite=true").then( function(response){
      if(response.ok){
        response.json().then(function(json){
          const faveRestaurants = json;
          // callback(null, restaurants);
          return faveRestaurants;
        })
      } else {
        // Get an error from server.
        const error = (`Request failed. Returned status of ${response.status}`);
        // callback(error, null);
        return
      }
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    // Check if the data has been cached in IndexedDB
    dbPromise.then(function(db) {
      var tx = db.transaction('restaurants');
      var keyValStore = tx.objectStore('restaurants');
      return keyValStore.getAll();
    }).then(function(val) {

      if (val.length == 0){
        fetch(DBHelper.DATABASE_URL).then( function(response){
          if(response.ok){
            response.json().then(function(json){
              const restaurants = json;
              callback(null, restaurants);
            })
          } else {
            // Get an error from server.
            const error = (`Request failed. Returned status of ${response.status}`);
            callback(error, null);
          }
        });    
      } else {
        // console.log('returning data from indexedDB');
        callback(null, val);
      }

      
    });

  }

  /**
   * Fetch all restaurant reviews
   */
  static fetchReviews(callback) {

    // Check if the data has been cached in IndexedDB
    dbPromise.then(function(db) {
      var tx = db.transaction('reviews');
      var keyValStore = tx.objectStore('reviews');
      return keyValStore.getAll();
    }).then(function(val) {

      if (val.length == 0){
        fetch(DBHelper.DATABASE_REVIEWS_URL).then( function(response){
          if(response.ok){
            response.json().then(function(json){
              const reviews = json;
              callback(null, reviews);
            })
          } else {
            // Get an error from server.
            const error = (`Request failed. Returned status of ${response.status}`);
            callback(error, null);
          }
        });    
      } else {
        // console.log('returning data from indexedDB');
        callback(null, val);
      }

      
    });

  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // Fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Received the restaurant.
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database.
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchReviewsById(id, callback) {
    // Fetch all reviews with proper error handling.
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        const filteredReviews = reviews.filter(r => r.restaurant_id == id);
        if (filteredReviews) {
          // Received the reviews.
          callback(null, filteredReviews);
        } else {
          // Reviews do not exist in the database.
          callback('Reviews do not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all cuisines') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all neighborhoods') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  /**
   * Restaurant source image URL - Large.
   */
  static imageSourceLargeForRestaurant(restaurant) {
    let photo_source = restaurant.photograph;
    if (photo_source != undefined){
      photo_source = photo_source.replace(".jpg", "");
      photo_source = `/img/${photo_source}-800_large_2x.jpg 2x, /img/${photo_source}-800_large_1x.jpg`;
    }
    return photo_source;
  }

  /**
   * Restaurant source image URL - Medium.
   */
  static imageSourceMediumForRestaurant(restaurant) {
    let photo_source = restaurant.photograph;
    if (photo_source != undefined){
      photo_source = photo_source.replace(".jpg", "");
      photo_source = `/img/${photo_source}-600_medium_2x.jpg 2x, /img/${photo_source}-600_medium_1x.jpg`;
    }
    return photo_source;
  }

  /**
   * Restaurant image URL.
   */
  static imageAltText(restaurant) {
    return (restaurant.photo_alt);
  }


  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}

// create open line to indexedDB API
let dbPromise = idb.open('test-db', 1, (upgradeDb) => {
    let store = upgradeDb.createObjectStore('restaurants', { keyPath: 'id'});
    let reviewsStore = upgradeDb.createObjectStore('reviews', { keyPath: 'id'});
  });

// add restaurant to "restaurants"
dbPromise.then( (db) => {
  return DBHelper.fetchRestaurants( (error, restaurantsJson) => {
    let tx = db.transaction('restaurants', 'readwrite');
    let restaurantsStore = tx.objectStore('restaurants');
    restaurantsJson.forEach( restaurant => restaurantsStore.put(restaurant) )   
    return tx.complete;
  });  
}).then( () => {
  console.log('Restaurants added');
});

// add reviews to "reviews"
dbPromise.then( (db) => {
  return DBHelper.fetchReviews( (error, reviewsJson) => {
    let tx = db.transaction('reviews', 'readwrite');
    let reviewsStore = tx.objectStore('reviews');
    reviewsJson.forEach( review => reviewsStore.put(review) )   
    return tx.complete;
  });  
}).then( () => {
  console.log('Reviews added');
});

let updateRestaurant = (restaurantJson) => {
	dbPromise.then( (db) => {
		let tx = db.transaction('restaurants', 'readwrite');
    	let restaurantsStore = tx.objectStore('restaurants');
    	restaurantsStore.put(restaurantJson);
    	return tx.complete;
	}).then( () => {
		console.log('Restaurant ' + restaurantJson.id + ' updated. Favorite is ' + restaurantJson.is_favorite);
	});
};


let restaurants,
  neighborhoods,
  cuisines;
let map;
let markers = [];

/**
 * Fetch the script that installs the service worker
 */
registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    // Register a service worker hosted at the root of the
    // site using the default scope.
    navigator.serviceWorker.register('/sw.js').then( registration => {
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
  // restaurant.is_favorite = false;
  const li = document.createElement('li');
  li.id = restaurant.id;
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

  const name = document.createElement('h2');
  const link = document.createElement('a');
  link.className = "restaurant-link";
  link.innerHTML = restaurant.name;
  link.href = DBHelper.urlForRestaurant(restaurant);
  const fave = document.createElement('i');
  fave.id = "star-" + restaurant.id;
  fave.dataset.id = restaurant.id;
  fave.classList.add('fa-star','fa-style');

  if ( restaurant.isFavorite ) {
    fave.classList.add('fas');
  } else {
    fave.classList.add('far');
  }

  fave.addEventListener("click", function(){
      const isFavorite = this.classList.contains('fas');
      const id = this.dataset.id;
      DBHelper.updateFavorite(isFavorite, id);
    });
  
  name.append(link);
  name.append(fave);
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
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDEzTdwKnrAUxK8CHLf8lWcDC-dgI3QiYk&libraries=places&callback=initMap';
    script.async = false;
    script.defer = true;
    document.head.appendChild(script);
  } else {
    updateRestaurants();
  }
});
