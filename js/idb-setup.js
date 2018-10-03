// create open line to indexedDB API
var dbPromise = idb.open('test-db', 1, function(upgradeDb) {
    var store = upgradeDb.createObjectStore('restaurants', { keyPath: 'id'});
  });

// add restaurant to "restaurants"
dbPromise.then(function(db) {
  return DBHelper.fetchRestaurants( function(error, restaurantsJson){
    var tx = db.transaction('restaurants', 'readwrite');
    var restaurantsStore = tx.objectStore('restaurants');
    restaurantsJson.forEach( restaurant => restaurantsStore.put(restaurant) )   
    return tx.complete;
  });  
}).then(function() {
  console.log('Restaurants added');
});