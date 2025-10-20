import { useState, useEffect } from 'react';
import WeatherSearch from './components/WeatherSearch/WeatherSearch';
import * as weatherService from './services/weatherService';
import WeatherDetails from './components/WeatherDetails/WeatherDetails';


const App = () => {
  const [ weather, setWeather ] = useState({})
  const [loading, setLoading ] = useState(true)

  useEffect(()=>{
    async function getInitialWeather(){
      await fetchData('manama')
    }

    getInitialWeather()
  }, [])

  const fetchData = async (city) => {
    setLoading(true)
    const data = await weatherService.show(city)
    const newWeatherState = {
      location: data.location.name,
      temperature: data.current.temp_c,
      condition: data.current.condition.text,
    };
    setWeather(newWeatherState)
    setLoading(false)
  }

  console.log(weather)

  return (
    <main>
      <h1>Weather API</h1>
      <WeatherSearch fetchData={fetchData}/>
      <WeatherDetails weather={weather} loading={loading}/>
    </main>
  );
}

export default App
