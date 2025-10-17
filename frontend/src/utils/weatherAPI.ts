/**
 * Weather API Service
 * 
 * Provides weather data for construction site locations
 * Uses Open-Meteo API (free, no API key required)
 * https://open-meteo.com/en/docs
 */

export interface WeatherData {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'storm';
  description: string;
  windSpeed: number;
  humidity: number;
  precipitation: number;
  feelsLike: number;
  workable: boolean;
  workabilityReason?: string;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Fetch current weather for a location
 */
export const getCurrentWeather = async (
  location: LocationCoordinates
): Promise<WeatherData> => {
  try {
    const { latitude, longitude } = location;
    
    // Open-Meteo API endpoint
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data = await response.json();
    const current = data.current;

    // Map weather code to condition
    const condition = mapWeatherCode(current.weather_code);
    
    // Determine workability
    const workability = determineWorkability(
      current.temperature_2m,
      current.wind_speed_10m,
      current.precipitation,
      condition
    );

    return {
      temperature: Math.round(current.temperature_2m),
      condition,
      description: getWeatherDescription(current.weather_code),
      windSpeed: Math.round(current.wind_speed_10m),
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      feelsLike: Math.round(current.temperature_2m), // Simplified
      workable: workability.workable,
      workabilityReason: workability.reason,
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    
    // Return fallback data
    return {
      temperature: 72,
      condition: 'sunny',
      description: 'Weather data unavailable',
      windSpeed: 0,
      humidity: 50,
      precipitation: 0,
      feelsLike: 72,
      workable: true,
    };
  }
};

/**
 * Geocode a city name to coordinates (simplified)
 */
export const geocodeLocation = async (cityName: string): Promise<LocationCoordinates> => {
  try {
    // Using Open-Meteo geocoding API
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      throw new Error('Location not found');
    }

    return {
      latitude: data.results[0].latitude,
      longitude: data.results[0].longitude,
    };
  } catch (error) {
    console.error('Error geocoding location:', error);
    
    // Default to Austin, TX
    return {
      latitude: 30.2672,
      longitude: -97.7431,
    };
  }
};

/**
 * Get weather by city name
 */
export const getWeatherByCity = async (cityName: string): Promise<WeatherData> => {
  const coordinates = await geocodeLocation(cityName);
  return getCurrentWeather(coordinates);
};

/**
 * Map Open-Meteo weather codes to simplified conditions
 */
const mapWeatherCode = (code: number): WeatherData['condition'] => {
  if (code === 0 || code === 1) return 'sunny';
  if (code === 2 || code === 3) return 'cloudy';
  if (code >= 51 && code <= 67) return 'rainy';
  if (code >= 71 && code <= 77) return 'snowy';
  if (code >= 95) return 'storm';
  return 'cloudy';
};

/**
 * Get human-readable weather description
 */
const getWeatherDescription = (code: number): string => {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
  };

  return descriptions[code] || 'Unknown conditions';
};

/**
 * Determine if weather is suitable for construction work
 */
const determineWorkability = (
  temperature: number,
  windSpeed: number,
  precipitation: number,
  condition: WeatherData['condition']
): { workable: boolean; reason?: string } => {
  // Temperature checks
  if (temperature < 20) {
    return { workable: false, reason: 'Too cold for safe outdoor work' };
  }
  if (temperature > 105) {
    return { workable: false, reason: 'Extreme heat - work restrictions apply' };
  }

  // Precipitation checks
  if (precipitation > 0.1) {
    return { workable: false, reason: 'Active precipitation - exterior work paused' };
  }

  // Wind checks
  if (windSpeed > 35) {
    return { workable: false, reason: 'High winds - crane/lift operations suspended' };
  }

  // Storm conditions
  if (condition === 'storm') {
    return { workable: false, reason: 'Severe weather - all outdoor work stopped' };
  }

  // Warnings
  if (temperature > 95) {
    return { workable: true, reason: 'High heat - extra hydration breaks required' };
  }
  if (windSpeed > 20) {
    return { workable: true, reason: 'Moderate winds - secure loose materials' };
  }

  return { workable: true };
};

/**
 * Mock data for testing/demo
 */
export const getMockWeatherData = (): WeatherData => {
  return {
    temperature: 75,
    condition: 'sunny',
    description: 'Clear skies',
    windSpeed: 8,
    humidity: 45,
    precipitation: 0,
    feelsLike: 73,
    workable: true,
  };
};
