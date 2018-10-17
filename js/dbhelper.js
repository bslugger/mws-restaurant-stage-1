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
