import React, { useState } from 'react';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Grid,
  Dialog,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
  Badge,
} from '@mui/material';
import {
  Close,
  ChevronLeft,
  ChevronRight,
  PhotoCamera,
  CalendarToday,
  WbSunny,
  Cloud,
  Grain,
} from '@mui/icons-material';

export interface ProgressPhoto {
  id: string;
  url: string;
  thumbnail?: string;
  title: string;
  description?: string;
  timestamp: string;
  phase?: string;
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  uploadedBy?: string;
  tags?: string[];
}

interface ProgressPhotosGalleryProps {
  photos: ProgressPhoto[];
  title?: string;
  showBeforeAfter?: boolean;
  columns?: 2 | 3 | 4;
  maxHeight?: number;
}

const ProgressPhotosGallery: React.FC<ProgressPhotosGalleryProps> = ({
  photos,
  title = 'Your Project Coming to Life',
  showBeforeAfter = false,
  columns = 3,
  maxHeight,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  // Responsive columns
  const gridColumns = isMobile ? 1 : isTablet ? 2 : columns;

  const handlePhotoClick = (index: number) => {
    setSelectedPhoto(index);
  };

  const handleClose = () => {
    setSelectedPhoto(null);
  };

  const handlePrevious = () => {
    if (selectedPhoto !== null && selectedPhoto > 0) {
      setSelectedPhoto(selectedPhoto - 1);
    }
  };

  const handleNext = () => {
    if (selectedPhoto !== null && selectedPhoto < photos.length - 1) {
      setSelectedPhoto(selectedPhoto + 1);
    }
  };

  const getWeatherIcon = (weather?: string) => {
    switch (weather) {
      case 'sunny':
        return <WbSunny sx={{ fontSize: 16 }} />;
      case 'cloudy':
        return <Cloud sx={{ fontSize: 16 }} />;
      case 'rainy':
        return <Grain sx={{ fontSize: 16 }} />;
      case 'snowy':
        return <Grain sx={{ fontSize: 16 }} />;
      default:
        return null;
    }
  };

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
              color: theme.palette.text.secondary,
            }}
          >
            <PhotoCamera sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography variant="h6" color="text.secondary">
              No photos yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Progress photos will appear here as work begins
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          {title && (
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhotoCamera color="primary" />
              <Typography variant="h6" fontWeight={600}>
                {title}
              </Typography>
              <Chip
                label={`${photos.length} photos`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          )}

          <Grid container spacing={2}>
            {photos.map((photo, index) => (
              <Grid item xs={12} sm={12 / gridColumns} key={photo.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.03)',
                      boxShadow: theme.shadows[8],
                    },
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onClick={() => handlePhotoClick(index)}
                >
                  <Badge
                    badgeContent={photo.phase}
                    color="primary"
                    sx={{
                      width: '100%',
                      '& .MuiBadge-badge': {
                        right: 10,
                        top: 10,
                        padding: '6px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      },
                    }}
                  >
                    <CardMedia
                      component="img"
                      height={maxHeight || 200}
                      image={photo.thumbnail || photo.url}
                      alt={photo.title}
                      sx={{
                        objectFit: 'cover',
                        width: '100%',
                      }}
                    />
                  </Badge>

                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                      color: 'white',
                      p: 1.5,
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                      {photo.title}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mt: 0.5,
                      }}
                    >
                      <CalendarToday sx={{ fontSize: 14 }} />
                      <Typography variant="caption">{photo.timestamp}</Typography>
                      {photo.weather && (
                        <>
                          {getWeatherIcon(photo.weather)}
                          <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                            {photo.weather}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {showBeforeAfter && photos.length >= 2 && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="success.main" fontWeight={600}>
                ✓ See the transformation from start to now!
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen Photo Dialog */}
      <Dialog
        open={selectedPhoto !== null}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
          },
        }}
      >
        {selectedPhoto !== null && (
          <Box sx={{ position: 'relative', height: '100%' }}>
            {/* Close Button */}
            <IconButton
              onClick={handleClose}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
                zIndex: 1,
              }}
            >
              <Close />
            </IconButton>

            {/* Navigation Buttons */}
            {selectedPhoto > 0 && (
              <IconButton
                onClick={handlePrevious}
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  zIndex: 1,
                }}
              >
                <ChevronLeft />
              </IconButton>
            )}

            {selectedPhoto < photos.length - 1 && (
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  zIndex: 1,
                }}
              >
                <ChevronRight />
              </IconButton>
            )}

            {/* Photo Display */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: isMobile ? 2 : 4,
              }}
            >
              <img
                src={photos[selectedPhoto].url}
                alt={photos[selectedPhoto].title}
                style={{
                  maxWidth: '100%',
                  maxHeight: isMobile ? '70%' : '80%',
                  objectFit: 'contain',
                }}
              />

              {/* Photo Info */}
              <Box
                sx={{
                  mt: 2,
                  textAlign: 'center',
                  color: 'white',
                  maxWidth: 600,
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  {photos[selectedPhoto].title}
                </Typography>
                {photos[selectedPhoto].description && (
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    {photos[selectedPhoto].description}
                  </Typography>
                )}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 2,
                    mt: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarToday sx={{ fontSize: 16 }} />
                    <Typography variant="caption">{photos[selectedPhoto].timestamp}</Typography>
                  </Box>
                  {photos[selectedPhoto].weather && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getWeatherIcon(photos[selectedPhoto].weather)}
                      <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                        {photos[selectedPhoto].weather}
                      </Typography>
                    </Box>
                  )}
                  {photos[selectedPhoto].phase && (
                    <Chip
                      label={photos[selectedPhoto].phase}
                      size="small"
                      color="primary"
                    />
                  )}
                </Box>
                {photos[selectedPhoto].tags && photos[selectedPhoto].tags!.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {photos[selectedPhoto].tags!.map((tag, idx) => (
                      <Chip
                        key={idx}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Dialog>
    </>
  );
};

export default ProgressPhotosGallery;
