
// src/services/weatherService.js

const API_KEY = 'YOUR API KEY HERE';
const BASE_URL = `http://api.weatherapi.com/v1/current.json?key=${API_KEY}`;


export const show = async (city) => {
  try {
    // build the query param with the input from the user
    const queryString = `&q=${city}`;

    // first add the query string to the base url and then call the api
    const res = await fetch(BASE_URL + queryString);

    // the api data is in json format, so first we have to convert to JS object
    const data = await res.json();


    console.log('Data:', data);

    // What we actually return is the js object that we converted
    return data;
  } catch (err) {
    console.log(err);
  }
};

