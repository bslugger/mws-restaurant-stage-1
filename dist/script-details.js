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


let restaurant;
let reviews;
let reviewForm;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false,
        title: "Restaurant listing for " + restaurant.name
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      self.map.data.getMap().title = "Restaurant listing for " + restaurant.name;
    }
  });
}

/**
 * Set focus for page elements on page load.
 */
 window.onload = () => {
  document.getElementById("restaurant-name").focus();
 }

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
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
    DBHelper.fetchReviewsById(id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
        console.error(error);
        return;
      }
      fillReviewsHTML();
      callback(null, reviews);
    })
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const picture = document.createElement('picture');
  const sourceLarge = document.createElement('source');
  sourceLarge.media = "(min-width: 960px)";
  sourceLarge.srcset = DBHelper.imageSourceLargeForRestaurant(restaurant);

  const sourceMedium = document.createElement('source');
  sourceMedium.media = "(max-width: 960px)";
  sourceMedium.srcset = DBHelper.imageSourceMediumForRestaurant(restaurant);

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = DBHelper.imageAltText(restaurant);

  picture.append(sourceLarge);
  picture.append(sourceMedium);
  picture.append(image);


  const cuisine = document.getElementById('restaurant-cuisine');  
  cuisine.innerHTML = restaurant.cuisine_type;

  const container = document.getElementById('restaurant-container'); 
  container.insertBefore(picture, cuisine);

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);

  const reviewContainer = document.getElementById('review-form-container');
  reviewContainer.parentNode.removeChild(reviewContainer);
  container.appendChild(reviewContainer);

  const submitButton = document.getElementById('submit-button');

  submitButton.addEventListener("click", () => {
    const reviewerName = document.getElementById('reviewer-name').value;
    const reviewerRating = document.getElementById('rating').value;
    const reviewerText = document.getElementById('review-textarea').value;

    reviewForm = {
      "restaurant_id": self.restaurant.id,
      "name": reviewerName,
      "rating": reviewerRating,
      "comments": reviewerText
    };
    const li = createReviewHTML(reviewForm);
    ul.appendChild(li);

    let online = navigator.onLine ? "online" : "offline";

    if (online == 'online') {
      DBHelper.addReview(reviewForm, self.restaurant.id);
    } 
    // else let the online event listener send it once the app goes back online
  });

  window.addEventListener('online', () => {
    DBHelper.addReview(reviewForm, self.restaurant.id);
  });
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.updatedAt);
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Fetch restaurant details as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
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
    fetchRestaurantFromURL((error, restaurant) => {
      if (error) { // Got an error!
        console.error(error);
      } else {
        fillBreadcrumb();
      }
    });
  }
});
