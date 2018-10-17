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
