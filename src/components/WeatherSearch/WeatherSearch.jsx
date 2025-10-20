// src/components/WeatherSearch/WeatherSearch.jsx

import { useState } from 'react';

const WeatherSearch = (props) => {
  const [city, setCity] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    props.fetchData(city)
    setCity('');
  };

  const handleCityChange = (e) => setCity(e.target.value)

  return (
    <section>
      <h2>Search</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="city">Enter a city:</label>
        <input
          id="city"
          type="text"
          value={city}
          onChange={handleCityChange}
          required
        />
        <button type="submit">Search</button>
      </form>
    </section>
  );
};

export default WeatherSearch;
