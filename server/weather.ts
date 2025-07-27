// Usando fetch nativo do Node.js 18+

// Coordenadas de Jaíba/MG
const JAIBA_COORDS = {
  latitude: -15.3372,
  longitude: -43.6719
};

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  weatherDescription: string;
  icon: string;
  feelsLike: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  timestamp: string;
}

export interface WeatherForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  weatherDescription: string;
  icon: string;
  precipitationProbability: number;
}

// Mapeamento de códigos de clima para descrições em português
const WEATHER_DESCRIPTIONS: { [key: number]: { description: string; icon: string } } = {
  0: { description: 'Céu limpo', icon: 'sun' },
  1: { description: 'Principalmente limpo', icon: 'sun' },
  2: { description: 'Parcialmente nublado', icon: 'cloud-sun' },
  3: { description: 'Nublado', icon: 'cloud' },
  45: { description: 'Névoa', icon: 'cloud' },
  48: { description: 'Névoa com geada', icon: 'cloud' },
  51: { description: 'Garoa leve', icon: 'cloud-drizzle' },
  53: { description: 'Garoa moderada', icon: 'cloud-drizzle' },
  55: { description: 'Garoa intensa', icon: 'cloud-drizzle' },
  56: { description: 'Garoa gelada leve', icon: 'cloud-drizzle' },
  57: { description: 'Garoa gelada intensa', icon: 'cloud-drizzle' },
  61: { description: 'Chuva leve', icon: 'cloud-rain' },
  63: { description: 'Chuva moderada', icon: 'cloud-rain' },
  65: { description: 'Chuva intensa', icon: 'cloud-rain' },
  66: { description: 'Chuva gelada leve', icon: 'cloud-rain' },
  67: { description: 'Chuva gelada intensa', icon: 'cloud-rain' },
  71: { description: 'Neve leve', icon: 'snowflake' },
  73: { description: 'Neve moderada', icon: 'snowflake' },
  75: { description: 'Neve intensa', icon: 'snowflake' },
  77: { description: 'Flocos de neve', icon: 'snowflake' },
  80: { description: 'Pancadas de chuva leves', icon: 'cloud-rain' },
  81: { description: 'Pancadas de chuva moderadas', icon: 'cloud-rain' },
  82: { description: 'Pancadas de chuva intensas', icon: 'cloud-rain' },
  85: { description: 'Pancadas de neve leves', icon: 'snowflake' },
  86: { description: 'Pancadas de neve intensas', icon: 'snowflake' },
  95: { description: 'Tempestade', icon: 'zap' },
  96: { description: 'Tempestade com granizo leve', icon: 'zap' },
  99: { description: 'Tempestade com granizo intenso', icon: 'zap' }
};

export async function getCurrentWeather(): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${JAIBA_COORDS.latitude}&longitude=${JAIBA_COORDS.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,weather_code,visibility,uv_index&timezone=America/Sao_Paulo&forecast_days=1`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;
    
    const weatherCode = current.weather_code;
    const weatherInfo = WEATHER_DESCRIPTIONS[weatherCode] || { 
      description: 'Condição desconhecida', 
      icon: 'cloud' 
    };

    return {
      temperature: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      weatherCode: weatherCode,
      weatherDescription: weatherInfo.description,
      icon: weatherInfo.icon,
      feelsLike: Math.round(current.apparent_temperature),
      pressure: current.surface_pressure,
      visibility: current.visibility,
      uvIndex: current.uv_index,
      timestamp: current.time
    };
  } catch (error) {
    console.error('Erro ao buscar dados meteorológicos:', error);
    return null;
  }
}

export async function getWeatherForecast(days: number = 7): Promise<WeatherForecast[]> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${JAIBA_COORDS.latitude}&longitude=${JAIBA_COORDS.longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=America/Sao_Paulo&forecast_days=${days}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    const daily = data.daily;
    
    const forecast: WeatherForecast[] = [];
    
    for (let i = 0; i < daily.time.length; i++) {
      const weatherCode = daily.weather_code[i];
      const weatherInfo = WEATHER_DESCRIPTIONS[weatherCode] || { 
        description: 'Condição desconhecida', 
        icon: 'cloud' 
      };

      forecast.push({
        date: daily.time[i],
        maxTemp: Math.round(daily.temperature_2m_max[i]),
        minTemp: Math.round(daily.temperature_2m_min[i]),
        weatherCode: weatherCode,
        weatherDescription: weatherInfo.description,
        icon: weatherInfo.icon,
        precipitationProbability: daily.precipitation_probability_max[i] || 0
      });
    }

    return forecast;
  } catch (error) {
    console.error('Erro ao buscar previsão do tempo:', error);
    return [];
  }
}

// Cache simples para evitar muitas chamadas à API
let weatherCache: { data: WeatherData | null; timestamp: number } = { 
  data: null, 
  timestamp: 0 
};

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

export async function getCachedWeather(): Promise<WeatherData | null> {
  const now = Date.now();
  
  if (weatherCache.data && (now - weatherCache.timestamp) < CACHE_DURATION) {
    return weatherCache.data;
  }
  
  const newData = await getCurrentWeather();
  weatherCache = {
    data: newData,
    timestamp: now
  };
  
  return newData;
}