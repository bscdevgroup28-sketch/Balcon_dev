import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  CircularProgress,
  useTheme,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  WbSunny,
  Cloud,
  Grain,
  Thunderstorm,
  AcUnit,
  Air,
  Opacity,
  CheckCircle,
  Warning,
  Refresh,
  Thermostat,
} from '@mui/icons-material';
import { WeatherData, getWeatherByCity, getMockWeatherData } from '../../utils/weatherAPI';

interface WeatherWidgetProps {
  location?: string;
  showWorkability?: boolean;
  compact?: boolean;
  useMockData?: boolean;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  location = 'Austin, TX',
  showWorkability = true,
  compact = false,
  useMockData = false,
}) => {
  const theme = useTheme();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);

    try {
      let data: WeatherData;
      
      if (useMockData) {
        // Use mock data for demo
        data = getMockWeatherData();
      } else {
        // Fetch real weather data
        data = await getWeatherByCity(location);
      }

      setWeather(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Unable to fetch weather data');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();

    // Refresh weather every 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, useMockData]);

  const getWeatherIcon = (condition: WeatherData['condition']) => {
    const iconProps = { sx: { fontSize: compact ? 40 : 56 } };

    switch (condition) {
      case 'sunny':
        return <WbSunny {...iconProps} sx={{ ...iconProps.sx, color: '#FFA726' }} />;
      case 'cloudy':
        return <Cloud {...iconProps} sx={{ ...iconProps.sx, color: '#90A4AE' }} />;
      case 'rainy':
        return <Grain {...iconProps} sx={{ ...iconProps.sx, color: '#42A5F5' }} />;
      case 'snowy':
        return <AcUnit {...iconProps} sx={{ ...iconProps.sx, color: '#64B5F6' }} />;
      case 'storm':
        return <Thunderstorm {...iconProps} sx={{ ...iconProps.sx, color: '#7E57C2' }} />;
      default:
        return <Cloud {...iconProps} />;
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp >= 95) return theme.palette.error.main;
    if (temp >= 85) return theme.palette.warning.main;
    if (temp <= 32) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: compact ? 120 : 200,
            }}
          >
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">{error || 'Weather data unavailable'}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getWeatherIcon(weather.condition)}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight={600} color={getTemperatureColor(weather.temperature)}>
                {weather.temperature}°F
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {weather.description}
              </Typography>
              {showWorkability && (
                <Chip
                  icon={weather.workable ? <CheckCircle /> : <Warning />}
                  label={weather.workable ? 'Good for work' : 'Work restricted'}
                  size="small"
                  color={weather.workable ? 'success' : 'warning'}
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Site Conditions
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {location}
            </Typography>
          </Box>
          <Tooltip title="Refresh weather">
            <IconButton size="small" onClick={fetchWeather}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Main Weather Display */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getWeatherIcon(weather.condition)}
            <Box>
              <Typography
                variant="h2"
                fontWeight={700}
                color={getTemperatureColor(weather.temperature)}
                sx={{ lineHeight: 1 }}
              >
                {weather.temperature}°
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                {weather.description}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Weather Details Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Thermostat sx={{ color: theme.palette.text.secondary }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Feels Like
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {weather.feelsLike}°F
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Air sx={{ color: theme.palette.text.secondary }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Wind Speed
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {weather.windSpeed} mph
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Opacity sx={{ color: theme.palette.text.secondary }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Humidity
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {weather.humidity}%
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Grain sx={{ color: theme.palette.text.secondary }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Precipitation
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {weather.precipitation > 0 ? `${weather.precipitation}"` : 'None'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Workability Status */}
        {showWorkability && (
          <Alert
            severity={weather.workable ? 'success' : 'warning'}
            icon={weather.workable ? <CheckCircle /> : <Warning />}
            sx={{ borderRadius: 2 }}
          >
            <Typography variant="body2" fontWeight={600}>
              {weather.workable ? '✓ Conditions suitable for outdoor work' : '⚠ Work restrictions in effect'}
            </Typography>
            {weather.workabilityReason && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                {weather.workabilityReason}
              </Typography>
            )}
          </Alert>
        )}

        {/* Last Updated */}
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2, textAlign: 'center' }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
