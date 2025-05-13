# /app/services/geolocation.py
import logging
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable, GeocoderServiceError

logger = logging.getLogger(__name__)

# Initialize the geolocator with a custom user agent
# IMPORTANT: Replace with your actual app name/version and contact info
geolocator = Nominatim(user_agent="AstroTrackerApp/0.1 (akamalov@gmail.com)")

async def get_coordinates_for_city(city: str, db: AsyncSession) -> Tuple[Optional[float], Optional[float]]:
    """
    Gets latitude and longitude for a city using Nominatim.
    
    Args:
        city: The name of the city.
        db: The database session (not used directly in this Nominatim implementation).
        
    Returns:
        A tuple containing (latitude, longitude) or (None, None) if not found or service error.
    """
    if not city or not city.strip():
        logger.warning("Attempted to geocode an empty or whitespace-only city name.")
        return (None, None)

    logger.info(f"Attempting to geocode city: '{city}' using Nominatim.")
    try:
        # geopy's geocode method is synchronous.
        # For high-concurrency production apps, consider running in a thread pool executor.
        location = geolocator.geocode(city, timeout=10) # 10 second timeout
        
        if location and location.latitude is not None and location.longitude is not None:
            logger.info(f"Successfully geocoded '{city}': ({location.latitude}, {location.longitude})")
            return (location.latitude, location.longitude)
        else:
            logger.warning(f"Could not geocode city: '{city}'. No location found or coordinates missing.")
            return (None, None)
            
    except GeocoderTimedOut:
        logger.error(f"Geocoding service (Nominatim) timed out for city: '{city}'")
        return (None, None)
    except GeocoderUnavailable:
        logger.error(f"Geocoding service (Nominatim) unavailable for city: '{city}'")
        return (None, None)
    except GeocoderServiceError as e:
        logger.error(f"Geocoding service (Nominatim) error for city: '{city}': {e}")
        return (None, None)
    except Exception as e:
        logger.error(f"An unexpected error occurred during geocoding for city '{city}': {e}", exc_info=True)
        return (None, None) 
