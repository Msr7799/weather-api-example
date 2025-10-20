// src/components/WeatherDetails/WeatherDetails.jsx

const WeatherDetails = ({weather, loading}) => {
  const  { location, temperature, condition} = weather;

  if(loading){
    return <h1>LOADING....</h1>
  }

  return (
    <section>
      <h2>Weather Details</h2>
      <p>Location: {location}</p>
      <p>Temperature: {temperature}</p>
      <p>Condition: {condition}</p>
    </section>
  );
};

export default WeatherDetails;
