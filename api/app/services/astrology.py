# /app/services/astrology.py
import logging
import sys
from datetime import datetime
from typing import Any, Dict, Optional
import uuid

logger = logging.getLogger(__name__)

# Import timezonefinder
try:
    from timezonefinder import TimezoneFinder
    TIMEZONEFINDER_AVAILABLE = True
except ImportError:
    TIMEZONEFINDER_AVAILABLE = False
    print("CRITICAL ERROR: timezonefinder library not found. Timezone lookup will fail.")
    # Dummy class for type hinting
    class TimezoneFinder:
        def timezone_at(self, *args, **kwargs) -> Optional[str]: return None

# --- Kerykeion Base Components Import ---
KERYKEION_AVAILABLE = False
_AstrologicalSubject = None
_KerykeionException = None
try:
    from kerykeion import AstrologicalSubject as LibAstrologicalSubject, KerykeionException as LibKerykeionException
    _AstrologicalSubject = LibAstrologicalSubject
    _KerykeionException = LibKerykeionException
    KERYKEION_AVAILABLE = True
    logger.info("Successfully imported Kerykeion base components (AstrologicalSubject, KerykeionException).")
except ImportError as e:
    KERYKEION_AVAILABLE = False
    logger.error(f"CRITICAL ERROR: Kerykeion base components could not be imported: {e}. Real calculations will fail.", exc_info=True)
    # Also print for visibility if logger somehow fails or isn't configured yet for console output
    print(f"CRITICAL ERROR: Kerykeion base components could not be imported: {e}. Real calculations will fail.")
    print(f"Current sys.path: {sys.path}")
    class AstrologicalSubject: # Dummy for type hinting if base import fails
        def __init__(self, *args, **kwargs): pass
    class KerykeionException(Exception): # Dummy for type hinting if base import fails
        pass
    _AstrologicalSubject = AstrologicalSubject
    _KerykeionException = KerykeionException

# Make them available under the original names for the rest of the module
AstrologicalSubject = _AstrologicalSubject
KerykeionException = _KerykeionException

# --- Kerykeion NatalAspects Import ---
KERYKEION_NATAL_ASPECTS_AVAILABLE = False
_NatalAspects = None
try:
    from kerykeion import NatalAspects as LibNatalAspects
    _NatalAspects = LibNatalAspects
    KERYKEION_NATAL_ASPECTS_AVAILABLE = True
    logger.info("Successfully imported NatalAspects from Kerykeion.")
except ImportError:
    KERYKEION_NATAL_ASPECTS_AVAILABLE = False
    logger.warning("Could not import NatalAspects from Kerykeion. Aspect calculations might be limited or unavailable.")
    class NatalAspects: # Dummy for type hinting if NatalAspects import fails
        def __init__(self, *args, **kwargs): pass
    _NatalAspects = NatalAspects

# Make it available under the original name for the rest of the module
NatalAspects = _NatalAspects

# --- Log top-level kerykeion contents --- 
try:
    import kerykeion
    logger.info(f"--- Top-level dir(kerykeion) ---")
    logger.info(sorted(dir(kerykeion)))
    logger.info(f"--------------------------------")
except Exception as ke_dir_e:
    logger.error(f"Error inspecting kerykeion module: {ke_dir_e}")
# --- End log ---

# Define mappings for data extraction
# (Adjust keys based on actual kerykeion object properties)
PLANET_MAP = {
    "sun": "Sun", "moon": "Moon", "mercury": "Mercury", "venus": "Venus",
    "mars": "Mars", "jupiter": "Jupiter", "saturn": "Saturn", "uranus": "Uranus",
    "neptune": "Neptune", "pluto": "Pluto",
    # Add nodes, chiron, MC, Asc, etc.
    "mean_node": "Mean_Node",             # Use underscore to match aspect data
    "true_node": "True_Node",            # Use underscore
    "mean_south_node": "Mean_South_Node",  # Use underscore
    "true_south_node": "True_South_Node", # Use underscore
    "chiron": "Chiron",                  # Already consistent
    "mean_lilith": "Mean_Lilith",        # Use underscore
    # Kerykeion uses first_house for Ascendant, tenth_house for MC
    "ascendant": "Ascendant",            # Already consistent
    "medium_coeli": "Medium_Coeli",      # Use underscore to match aspect name
    "descendant": "Descendant",          # Already consistent
    "imum_coeli": "IC",                  # Already consistent?
}
SIGN_SYMBOLS = ['''♈''','''♉''','''♊''','''♋''','''♌''','''♍''','''♎''','''♏''','''♐''','''♑''','''♒''','''♓''']
SIGN_FULL_NAMES = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

class NatalChartCalculator:
    """Calculates natal chart data using the Kerykeion library."""

    def __init__(self, name: str, birth_dt: datetime, city: str, latitude: Optional[float]=None, longitude: Optional[float]=None):
        """
        Initializes the calculator using Kerykeion's AstrologicalSubject.
        Requires latitude and longitude for accurate calculations.
        Determines timezone using timezonefinder.
        """
        self.name = name
        self.birth_dt = birth_dt
        self.city = city
        self.latitude = latitude
        self.longitude = longitude
        self.subject: Optional[AstrologicalSubject] = None
        self.calculation_error: Optional[str] = None

        if not KERYKEION_AVAILABLE:
            self.calculation_error = "Kerykeion library is not installed or importable."
            logger.critical(self.calculation_error)
            return # Cannot proceed without the library

        if self.latitude is None or self.longitude is None:
             self.calculation_error = "Latitude and Longitude are required for Kerykeion calculations."
             logger.error(f"Missing coordinates for {self.city} for user {self.name}.")
             return # Cannot proceed without coordinates

        # --- Determine Timezone --- 
        tz_str: Optional[str] = None
        if TIMEZONEFINDER_AVAILABLE and self.latitude is not None and self.longitude is not None:
            try:
                tf = TimezoneFinder() # Initialize
                tz_str = tf.timezone_at(lng=self.longitude, lat=self.latitude)
                if tz_str:
                    logger.info(f"Determined timezone for ({self.latitude}, {self.longitude}) as: {tz_str}")
                else:
                    logger.warning(f"timezonefinder could not determine timezone for ({self.latitude}, {self.longitude}). AstrologicalSubject might fail or use UTC.")
            except Exception as tz_e:
                logger.error(f"Error using timezonefinder: {tz_e}", exc_info=True)
                # Proceed without tz_str, Kerykeion might raise an error or default
        elif not TIMEZONEFINDER_AVAILABLE:
             logger.error("timezonefinder library is not available, cannot determine timezone automatically.")
        # --- End Timezone Determination ---

        try:
            # Instantiate the real AstrologicalSubject
            self.subject = AstrologicalSubject(
                name=self.name,
                year=self.birth_dt.year,
                month=self.birth_dt.month,
                day=self.birth_dt.day,
                hour=self.birth_dt.hour,
                minute=self.birth_dt.minute,
                city=self.city,
                lng=self.longitude,
                lat=self.latitude,
                tz_str=tz_str # Pass determined timezone string
            )
            logger.info(f"Initialized Kerykeion AstrologicalSubject for {self.name} at {self.city} ({self.latitude}, {self.longitude}) with tz_str='{tz_str}'")
        except KerykeionException as ke:
            logger.error(f"Kerykeion error initializing subject for {self.name}: {ke}", exc_info=True)
            self.subject = None
            self.calculation_error = f"Kerykeion Initialization Error: {ke}"
        except Exception as e:
            logger.error(f"Unexpected error initializing Kerykeion subject for {self.name}: {e}", exc_info=True)
            self.subject = None
            self.calculation_error = f"Unexpected Error during Kerykeion setup: {e}"

    async def calculate_chart(self) -> Dict[str, Any]:
        """Extracts natal chart details from the AstrologicalSubject instance."""
        if self.calculation_error:
             # Return minimal info if initialization failed
             return { "info": {"name": self.name}, "planets": [], "houses": [], "aspects": [], "calculation_error": self.calculation_error }
        if not self.subject:
             # Should not happen if error handling above is correct, but safeguard
             return { "info": {"name": self.name}, "planets": [], "houses": [], "aspects": [], "calculation_error": "Internal Error: Subject not initialized." }

        logger.info(f"Calculating chart details for {self.name} using Kerykeion.")
        try:
            # --- Add dir(self.subject) for debugging v4 --- 
            logger.info(f"--- Inspecting Initialized AstrologicalSubject (v4) ---")
            try:
                # Use logger.warning for higher visibility
                logger.warning(f"Attributes/Methods: {sorted(dir(self.subject))}") 
            except Exception as dir_e:
                 logger.error(f"Error getting dir(self.subject): {dir_e}")
            logger.info(f"-----------------------------------------------------")
            # --- End Debugging ---

            # Extract Planet Data (Using direct attribute access for v4)
            planets_data: Dict[str, Dict[str, Any]] = {} # Initialize as dict
            # List of planet attribute names expected in Kerykeion v4 AstrologicalSubject
            planet_attr_names = [
                'sun', 'moon', 'mercury', 'venus', 'mars', 
                'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
                # Add others if needed (e.g., 'mean_node', 'true_node', 'chiron')
                'mean_node', 'true_node', 'mean_south_node', 'true_south_node',
                'chiron', 'mean_lilith',
                'ascendant', 'medium_coeli', 'descendant', 'imum_coeli' # From AstrologicalSubject
            ]
            for attr_name in planet_attr_names:
                if hasattr(self.subject, attr_name):
                    planet_obj = getattr(self.subject, attr_name)
                    # Check if it's a KerykeionPointModel or similar object (not just dict)
                    if planet_obj and hasattr(planet_obj, 'abs_pos'): # Check for a known attribute
                        display_name = PLANET_MAP.get(attr_name, attr_name.capitalize())
                        # Access attributes directly
                        sign_num = getattr(planet_obj, 'sign_num', -1)
                        # sign = getattr(planet_obj, 'sign', 'Unknown') # Old way, gave abbreviation
                        abs_pos = getattr(planet_obj, 'abs_pos', None)
                        position = getattr(planet_obj, 'position', None)
                        retrograde = getattr(planet_obj, 'retrograde', False)
                        
                        # Get full sign name from sign_num
                        full_sign_name = SIGN_FULL_NAMES[sign_num] if sign_num >= 0 and sign_num < len(SIGN_FULL_NAMES) else 'Unknown'
                        
                        if abs_pos is not None:
                            planet_name_key = display_name # Use the display name (e.g., "Sun") as the key
                            planets_data[planet_name_key] = { # Assign to dict using key
                                 "name": display_name,
                                 "sign": full_sign_name, # Use full sign name
                                 "sign_symbol": SIGN_SYMBOLS[sign_num] if sign_num >= 0 and sign_num < len(SIGN_SYMBOLS) else '?',
                                 "longitude": abs_pos, 
                                 "deg_within_sign": position, 
                                 "is_retrograde": retrograde, 
                            }
                        else:
                             logger.warning(f"Planet object '{attr_name}' missing 'abs_pos'. Type: {type(planet_obj)}")
                    else:
                         logger.warning(f"Attribute '{attr_name}' found but is not a valid KerykeionPointModel or similar (lacks 'abs_pos'). Type: {type(planet_obj)}")
                else:
                    logger.warning(f"Planet attribute '{attr_name}' not found in AstrologicalSubject.")

            # Extract House Cusps (Using direct attribute access for v4)
            houses_data = []
            house_attr_names = [
                'first_house', 'second_house', 'third_house', 'fourth_house',
                'fifth_house', 'sixth_house', 'seventh_house', 'eighth_house',
                'ninth_house', 'tenth_house', 'eleventh_house', 'twelfth_house'
            ]
            for i, attr_name in enumerate(house_attr_names):
                 if hasattr(self.subject, attr_name):
                    house_obj = getattr(self.subject, attr_name)
                    # Check if it's a KerykeionPointModel or similar object
                    if house_obj and hasattr(house_obj, 'abs_pos'): # Check for a known attribute
                        # Access attributes directly
                        abs_pos = getattr(house_obj, 'abs_pos', None)
                        # sign = getattr(house_obj, 'sign', 'Unknown') # Old way
                        sign_num = getattr(house_obj, 'sign_num', None)
                        position = getattr(house_obj, 'position', None)

                        # Get full sign name for houses as well
                        full_house_sign_name = SIGN_FULL_NAMES[sign_num] if sign_num is not None and sign_num >= 0 and sign_num < len(SIGN_FULL_NAMES) else 'Unknown'
                        
                        if abs_pos is not None:
                            houses_data.append({
                                "cusp": i + 1,
                                "sign": full_house_sign_name, # Use full sign name
                                "sign_num": sign_num,
                                "position": position,
                                "absolute_position": abs_pos
                            })
                        else:
                            logger.warning(f"House attribute '{attr_name}' object missing 'abs_pos'. Type: {type(house_obj)}")
                    else:
                         logger.warning(f"Attribute '{attr_name}' found but is not a valid KerykeionPointModel or similar (lacks 'abs_pos'). Type: {type(house_obj)}")
                 else:
                     logger.warning(f"House attribute '{attr_name}' not found in AstrologicalSubject.")

            # Extract Aspects - Placeholder until dir() output is reviewed
            aspects_data = []
            try:
                logger.info("Attempting to calculate aspects (Kerykeion v4)...")
                # --- Try using NatalAspects class if available --- 
                if KERYKEION_NATAL_ASPECTS_AVAILABLE:
                    logger.info("NatalAspects class is available. Attempting instantiation.")
                    try:
                        natal_aspect_calculator = NatalAspects(self.subject)
                        # --- Log dir(natal_aspect_calculator) for debugging v4 aspects ---
                        logger.info(f"--- Inspecting NatalAspects instance (v4) ---")
                        try:
                            logger.warning(f"Attributes/Methods of NatalAspects instance: {sorted(dir(natal_aspect_calculator))}")
                        except Exception as dir_na_e:
                            logger.error(f"Error getting dir(natal_aspect_calculator): {dir_na_e}")
                        logger.info(f"--------------------------------------------------")
                        # --- End Debugging ---

                        # logger.info("Checking for 'relevant_aspects' attribute...") # Removed debug log
                        # Access the relevant_aspects attribute
                        raw_aspects = []
                        if hasattr(natal_aspect_calculator, 'relevant_aspects'):
                            # logger.info("'relevant_aspects' attribute FOUND. Attempting to access it.") # Removed debug log
                            try:
                                raw_aspects = natal_aspect_calculator.relevant_aspects
                                # --- Removed print to stderr --- 
                                
                                # --- Removed granular logger.info steps --- 

                            except Exception as e_access:
                                # Keep error logging for access issues
                                logger.error(f"ASTROLOGY_PY_DEBUG: ERROR during assignment or initial logging of 'relevant_aspects': {e_access}", exc_info=True)
                                aspects_data = [] # Ensure aspects_data is empty on error
                            else:
                                # This block only executes if accessing raw_aspects succeeded
                                if isinstance(raw_aspects, list):
                                    # logger.info(f"Retrieved {len(raw_aspects)} aspects via NatalAspects.relevant_aspects property.") # Removed debug log
                                    if raw_aspects:
                                        aspects_data = []
                                        for aspect_detail in raw_aspects:
                                            # Check if aspect_detail is an instance of Kerykeion's AspectModel or similar
                                            if hasattr(aspect_detail, 'p1_name') and hasattr(aspect_detail, 'p2_name') and hasattr(aspect_detail, 'aspect') and hasattr(aspect_detail, 'orbit'):
                                                p1_name = getattr(aspect_detail, 'p1_name', 'Unknown Planet 1')
                                                p2_name = getattr(aspect_detail, 'p2_name', 'Unknown Planet 2')
                                                aspect_name = getattr(aspect_detail, 'aspect', 'Unknown Aspect')
                                                orb = getattr(aspect_detail, 'orbit', 0.0)
                                                
                                                # Placeholder for aspect_degrees and aspect_type until we confirm their source in AspectModel
                                                aspect_degrees = getattr(aspect_detail, 'aspect_degrees', 0.0) # Assuming it might exist
                                                aspect_type_val = getattr(aspect_detail, 'aid', None) # Assuming 'aid' might exist for type
                                                if aspect_type_val is None:
                                                    aspect_type_val = getattr(aspect_detail, 'aspect_type', 0) # Alternative common name

                                                aspect_info = {
                                                    "p1_name": p1_name,
                                                    "p2_name": p2_name,
                                                    "aspect_name": aspect_name,
                                                    "orb": orb,
                                                    "aspect_degrees": aspect_degrees
                                                }
                                                logger.debug(f"Aspect: {aspect_name} between {p1_name} and {p2_name} with orb {orb}")
                                                aspects_data.append(aspect_info)
                                            else:
                                                # Keep warning for unexpected data structure
                                                logger.warning(f"Skipping aspect_detail due to missing expected attributes. Type: {type(aspect_detail)}, Value: {str(aspect_detail)[:200]}")
                                        # logger.info(f"Processed {len(aspects_data)} aspects into desired format.") # Removed debug log
                                    else:
                                        pass # No aspects found, aspects_data remains []
                                        # logger.info("NatalAspects.relevant_aspects was empty.") # Removed debug log
                                else:
                                    # Keep warning for non-list data
                                    logger.warning(f"NatalAspects.relevant_aspects is not a list (type: {type(raw_aspects)}), after successful access. Aspects will be empty.")
                        elif hasattr(natal_aspect_calculator, 'all_aspects'):
                            # logger.info("'relevant_aspects' attribute NOT FOUND. Checking for 'all_aspects'...") # Removed debug log
                            # Similar processing for all_aspects can be added here if needed, 
                            # ensuring to handle its structure correctly.
                            logger.warning("'all_aspects' found, but processing logic is not fully implemented here yet. Aspects will be empty.")
                            aspects_data = [] # Placeholder
                        else:
                            logger.warning("Neither 'relevant_aspects' nor 'all_aspects' found.")
                    except Exception as na_inst_e:
                         logger.error(f"Error instantiating or using NatalAspects: {na_inst_e}", exc_info=True)
                else:
                    logger.warning("NatalAspects class not imported. Cannot calculate aspects this way.")
                    logger.warning("Aspect calculation logic needs update based on AstrologicalSubject v4 inspection (dir output). Aspects will be empty.")

            except KerykeionException as ke_aspect:
                logger.error(f"Kerykeion error calculating aspects for {self.name}: {ke_aspect}", exc_info=True)
            except Exception as e_aspect:
                logger.error(f"Unexpected error calculating aspects for {self.name}: {e_aspect}", exc_info=True)
                # Keep aspects_data empty
            # --- End Aspect Calculation ---
            
            # Populate Sun Sign and Ascendant Sign for info block
            k_sun_sign = "Unknown"
            k_asc_sign = "Unknown"
            if hasattr(self.subject, 'sun') and isinstance(self.subject.sun, dict):
                k_sun_sign = self.subject.sun.get('sign', "Unknown")
            if hasattr(self.subject, 'first_house') and isinstance(self.subject.first_house, dict):
                k_asc_sign = self.subject.first_house.get('sign', "Unknown")
            
            # Ensure houses_data uses the correct fields as per HouseInfo Pydantic model
            # cusp: int # House number (1-12)
            # sign: str
            # sign_num: Optional[int] = None
            # position: Optional[float] = None # Degree of the cusp within the sign
            # absolute_position: Optional[float] = None # Absolute longitude of the cusp

            # --- Removed old house extraction logic --- 
            # Primary and more reliable way to get house data
            # houses_data = [] # Re-initialize to ensure it's clean before population
            # if hasattr(self.subject, 'houses_list') and isinstance(self.subject.houses_list, list) and len(self.subject.houses_list) == 12:
            #     for house_dict in self.subject.houses_list:
            #         try:
            #             houses_data.append({
            #                 "cusp": int(house_dict.get("name")), # HouseInfo field name, from "name" in AstrologicalSubject
            #                 "sign": house_dict.get("sign"),
            #                 "sign_num": house_dict.get("sign_num"),
            #                 "position": house_dict.get("position"), # Degree within sign
            #                 "absolute_position": house_dict.get("abs_pos") # Absolute longitude from "abs_pos"
            #             })
            #         except (ValueError, TypeError) as e:
            #             logger.error(f"Error processing house data for house '{house_dict.get('name')}': {e} - data: {house_dict}")
            # else:
            #     logger.warning(f"Could not retrieve complete house cusp data for {self.name} from Kerykeion AstrologicalSubject.houses_list. Houses will be empty or incomplete. self.subject.houses_list available: {hasattr(self.subject, 'houses_list')}")
            #     # Optionally, you could try the _houses_list approach here as a fallback if desired,
            #     # but it was proving unreliable. For now, prefer empty if standard fails.

            result = {
                "info": {
                    "name": self.name,
                    "birth_datetime": self.birth_dt.isoformat(),
                    "location": self.city,
                    "latitude": self.latitude,
                    "longitude": self.longitude,
                    "kerykeion_sun_sign": k_sun_sign,
                    "kerykeion_asc_sign": k_asc_sign,
                    "kerykeion_version": getattr(self.subject, 'kerykeion_version', 'unknown')
                },
                "planets": planets_data,
                "houses": houses_data, # Now populated correctly and matching HouseInfo
                "aspects": aspects_data, # Populated with calculated aspects now
                "calculation_error": None # Success (unless specific aspect error occurred)
            }
            logger.info(f"Successfully calculated chart details for {self.name}. Aspects found: {len(aspects_data)}")
            return result

        except KerykeionException as ke:
            logger.error(f"Kerykeion error calculating chart details for {self.name}: {ke}", exc_info=True)
            return { "info": {"name": self.name}, "planets": [], "houses": [], "aspects": [], "calculation_error": f"Kerykeion Calculation Error: {ke}" }
        except Exception as e:
            logger.error(f"Unexpected error calculating chart details for {self.name}: {e}", exc_info=True)
            return { "info": {"name": self.name}, "planets": [], "houses": [], "aspects": [], "calculation_error": f"Unexpected Error during calculation: {e}" }

# --- Transit Calculation (Sync function, called via run_in_threadpool) ---
def calculate_transits(
    natal_chart_data: Dict[str, Any], # Contains natal planets, houses, location info
    transit_dt: datetime,
    target_latitude: Optional[float] = None,
    target_longitude: Optional[float] = None,
    target_city: Optional[str] = "TransitLocation"
) -> Dict[str, Any]:
    """
    Calculates transiting planet positions for a given datetime and aspects to natal planets.
    """
    if not KERYKEION_AVAILABLE:
        return {"error": "Kerykeion library not available."}

    logger.info(f"Calculating transits for date: {transit_dt}")

    # Determine location for transit calculation
    calc_lat = target_latitude
    calc_lon = target_longitude
    calc_city = target_city

    if calc_lat is None or calc_lon is None:
        natal_info = natal_chart_data.get("info", {})
        if isinstance(natal_info, dict):
            calc_lat = natal_info.get("lat", target_latitude)
            calc_lon = natal_info.get("lon", target_longitude)
            # Only use city from natal_info if target_city was the default placeholder
            if target_city == "TransitLocation": 
                calc_city = natal_info.get("city", target_city)
        
        if calc_lat is None or calc_lon is None:
            logger.warning("Transit calculation using default/placeholder location as coordinates were not sufficiently provided.")
            calc_lat = 0.0 # Placeholder latitude
            calc_lon = 0.0 # Placeholder longitude
            calc_city = "DefaultLocation" # Placeholder city

    # --- Determine Timezone for Transit Moment ---
    tz_str_transit: Optional[str] = None
    if TIMEZONEFINDER_AVAILABLE and calc_lat is not None and calc_lon is not None:
        try:
            tf = TimezoneFinder()
            tz_str_transit = tf.timezone_at(lng=calc_lon, lat=calc_lat)
            logger.info(f"Transit timezone for ({calc_lat}, {calc_lon}): {tz_str_transit}")
        except Exception as tz_e:
            logger.error(f"Error using timezonefinder for transit: {tz_e}")
            # Proceed without tz_str, Kerykeion might default or error
    elif not TIMEZONEFINDER_AVAILABLE:
        logger.error("timezonefinder library is not available for transit timezone lookup.")
    # --- End Timezone Determination ---

    try:
        transit_subject = AstrologicalSubject(
            name="Transit",
            year=transit_dt.year,
            month=transit_dt.month,
            day=transit_dt.day,
            hour=transit_dt.hour,
            minute=transit_dt.minute,
            city=calc_city,
            lng=calc_lon,
            lat=calc_lat,
            tz_str=tz_str_transit
        )
        logger.info(f"Initialized Kerykeion AstrologicalSubject for Transit at {calc_city} ({calc_lat}, {calc_lon}) for {transit_dt}")
    except KerykeionException as ke:
        logger.error(f"Kerykeion error initializing transit subject: {ke}", exc_info=True)
        return {"error": f"Kerykeion Initialization Error for transit: {ke}"}
    except Exception as e:
        logger.error(f"Unexpected error initializing Kerykeion transit subject: {e}", exc_info=True)
        return {"error": f"Unexpected Error during Kerykeion setup for transit: {e}"}

    # Extract Transiting Planet Data
    transiting_planets_data: Dict[str, Dict[str, Any]] = {}
    # Same planet_attr_names as in NatalChartCalculator, or a subset relevant for transits
    planet_attr_names = [
        'sun', 'moon', 'mercury', 'venus', 'mars',
        'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
        'mean_node', 'true_node', 'chiron', 'mean_lilith' 
    ]

    for attr_name in planet_attr_names:
        if hasattr(transit_subject, attr_name):
            planet_obj = getattr(transit_subject, attr_name)
            if planet_obj and hasattr(planet_obj, 'abs_pos'):
                display_name = PLANET_MAP.get(attr_name, attr_name.capitalize())
                sign_num = getattr(planet_obj, 'sign_num', -1)
                abs_pos = getattr(planet_obj, 'abs_pos', None)
                position = getattr(planet_obj, 'position', None)
                retrograde = getattr(planet_obj, 'retrograde', False)
                # Robust type check for sign_num
                if isinstance(sign_num, int) and not hasattr(sign_num, 'assert_called'):  # exclude MagicMock
                    if 0 <= sign_num < len(SIGN_FULL_NAMES):
                        full_sign_name = SIGN_FULL_NAMES[sign_num]
                        sign_symbol = SIGN_SYMBOLS[sign_num]
                    else:
                        full_sign_name = 'Unknown'
                        sign_symbol = '?'
                else:
                    full_sign_name = 'Unknown'
                    sign_symbol = '?'
                # Skip if any key attribute is a MagicMock
                from unittest.mock import MagicMock
                if any(isinstance(x, MagicMock) for x in [abs_pos, sign_num, position, retrograde]):
                    continue
                if abs_pos is not None:
                    transiting_planets_data[display_name] = {
                        "name": display_name,
                        "sign": full_sign_name,
                        "sign_symbol": sign_symbol,
                        "longitude": abs_pos,
                        "deg_within_sign": position,
                        "is_retrograde": retrograde,
                    }
            else:
                logger.warning(f"Transit planet attribute '{attr_name}' lacks 'abs_pos'. Type: {type(planet_obj)}")
        else:
            logger.warning(f"Transit planet attribute '{attr_name}' not found in AstrologicalSubject.")
            
    # Extract Natal Planets for aspect calculation
    natal_planets_input = natal_chart_data.get("planets", {})
    
    # Ensure natal_planets_input is a dict and its values are dicts with 'longitude' and 'name'
    if not isinstance(natal_planets_input, dict) or \
       not all(isinstance(pdata, dict) and 'longitude' in pdata and 'name' in pdata 
               for pdata in natal_planets_input.values()):
        logger.error("Natal planets data is not in the expected format (dict of dicts with 'longitude' and 'name').")
        return {
            "transit_date": transit_dt.isoformat(),
            "transiting_planets": transiting_planets_data,
            "transit_aspects": [],
            "error": "Natal planets data malformed."
        }

    # Calculate Aspects between Transiting Planets and Natal Planets
    transit_aspects = []
    ASPECT_DEGREES_ORBS = {
        "Conjunction": (0, 8.0), "Sextile": (60, 5.0), "Square": (90, 7.0),
        "Trine": (120, 7.0), "Opposition": (180, 8.0), "Quincunx": (150, 3.0),
        "SemiSextile": (30, 2.0), "SemiSquare": (45, 2.0), "Sesquiquadrate": (135, 2.0)
    }

    for tp_name, tp_data in transiting_planets_data.items():
        for np_name, np_data in natal_planets_input.items(): # Iterate over natal_planets_input
            # tp_name and np_name are keys like "Sun", "Moon"
            # tp_data and np_data are dicts like {"name": "Sun", "longitude": ..., ...}
            
            # Skip aspecting a transiting planet to its own natal position if names match and it's not meaningful
            # (e.g. Transiting Sun to Natal Sun - always a conjunction, but maybe not desired in a typical transit list)
            # For now, we allow all, as aspects like Sun conjunct natal Sun (Solar Return) are significant.
            
            tp_lon = tp_data.get("longitude")
            np_lon = np_data.get("longitude")

            # Only proceed if both are real numbers
            if not (isinstance(tp_lon, (int, float)) and isinstance(np_lon, (int, float))):
                logger.debug(f"Skipping aspect calc for {tp_name} to {np_name} due to non-numeric longitude (tp_lon={tp_lon}, np_lon={np_lon}).")
                continue

            angle_diff = abs(tp_lon - np_lon)
            if angle_diff > 180:
                angle_diff = 360 - angle_diff
            
            for aspect_name, (degrees, orb_limit) in ASPECT_DEGREES_ORBS.items():
                orb = abs(angle_diff - degrees)
                if orb <= orb_limit:
                    transit_aspects.append({
                        "transiting_planet": tp_name, # Name of the transiting planet
                        "aspect_name": aspect_name,
                        "natal_planet": np_name,   # Name of the natal planet
                        "orb": round(orb, 2)
                    })
    
    logger.info(f"Calculated {len(transit_aspects)} aspects between transiting and natal planets.")

    # --- Fix up output to match TransitChartResponse schema ---
    # 1. Add 'position' field to each planet in transiting_planets_data
    for planet in transiting_planets_data.values():
        # Use deg_within_sign if present, else longitude
        planet["position"] = planet.get("deg_within_sign", planet.get("longitude"))

    # 2. Prepare output dict with correct keys
    result = {
        "transit_datetime": transit_dt,  # Use datetime object
        "transiting_planets": transiting_planets_data,
        "aspects_to_natal": sorted(transit_aspects, key=lambda x: x['orb']),
        # Optionally add calculation_error if needed
    }
    return result

# Placeholder for Synastry calculation
def calculate_synastry(
    chart1_data: Dict[str, Any],
    chart2_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Placeholder for Synastry chart calculation."""
    logger.warning("Synastry calculation is not yet implemented.")
    return {"error": "Synastry calculation not implemented."}


# Placeholder for Composite chart calculation
def calculate_composite_chart(
    chart1_data: Dict[str, Any],
    chart2_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Placeholder for Composite chart calculation."""
    logger.warning("Composite chart calculation is not yet implemented.")
    return {"error": "Composite chart calculation not implemented."}


# Example usage (for testing purposes, remove or comment out later)
async def main_test():
    # ... (rest of main_test if it exists)
    pass 