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

