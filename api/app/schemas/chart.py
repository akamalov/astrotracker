from pydantic import BaseModel, Field, ConfigDict # Import ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from sqlalchemy import Column, String, DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as SQLAlchemyUUID

# --- Data Structures for Calculated Chart ---
# These models represent the detailed output of the astrology engine

class CelestialBody(BaseModel):
    name: str
    sign: str
    sign_num: int
    position: float # Degrees within the sign (e.g., 15.75)
    absolute_position: float # 0-360 degrees longitude
    house: str # House number as string (e.g., "1", "12")
    speed: Optional[float] = None
    retrograde: Optional[bool] = False

class HouseCusp(BaseModel):
    cusp: int # House number (1-12)
    sign: str
    sign_num: int
    position: float # Degrees within the sign
    absolute_position: float # 0-360 degrees longitude

class Aspect(BaseModel):
    p1_name: str
    p2_name: str
    aspect_name: str # e.g., "Conjunction", "Square"
    orb: float # Orb of the aspect in degrees
    aspect_degrees: int # Standard angle (e.g., 0, 90, 120)

class ChartCalculationResult(BaseModel):
    """Represents the raw calculated chart data from the service."""
    planets: Dict[str, CelestialBody] # e.g., {"Sun": ..., "Moon": ...}
    houses: List[HouseCusp]
    aspects: List[Aspect]
    ascendant: Optional[CelestialBody] = None
    midheaven: Optional[CelestialBody] = None
    # Add other relevant calculated data points (e.g., elements, modes) if needed
    calculation_error: Optional[str] = None

# <<< Define NatalChartData Pydantic model >>>
class NatalChartInfo(BaseModel):
    name: str
    birth_datetime: str # ISO format string
    location: str # City name
    kerykeion_sun_sign: Optional[str] = None
    kerykeion_asc_sign: Optional[str] = None

class NatalChartData(BaseModel):
    """Pydantic model for the response of the /natal/calculate endpoint."""
    info: NatalChartInfo
    planets: Dict[str, CelestialBody]
    houses: List[HouseCusp]
    aspects: List[Aspect]
    calculation_error: Optional[str] = None
# <<< End definition >>>

# --- Base Pydantic (NOT for DB table inheritance) ---
class ChartBase(BaseModel):
    name: str
    birth_datetime: datetime
    city: str
    location_name: Optional[str] = None # Optional as it might be derived or detailed

# Schema for creating a chart (inherits required fields from Base)
class ChartCreate(ChartBase):
    latitude: Optional[float] = None
    longitude: Optional[float] = None

# Schema for reading chart data (includes fields from Base)
class ChartRead(ChartBase):
    id: UUID
    user_id: UUID
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    # Add model_config here if ChartRead itself needs ORM mode
    model_config = ConfigDict(from_attributes=True) # Pydantic v2 equivalent of orm_mode

# Add ChartDisplay which is used by CRUD endpoints (can inherit from ChartRead)
class ChartDisplay(ChartRead):
    """Schema for displaying chart data in API responses (CRUD)."""
    # Inherits model_config from ChartRead, but explicitly defining is fine too
    model_config = ConfigDict(from_attributes=True) # <<< ENSURE THIS LINE IS PRESENT AND CORRECT
    pass

class ChartList(BaseModel):
    """Simplified data for listing multiple saved charts."""
    id: UUID
    name: str
    birth_datetime: datetime
    location_name: Optional[str]
    user_id: UUID
    # class Config was Pydantic v1, use model_config in v2
    model_config = ConfigDict(from_attributes=True) # Use model_config

# --- API Endpoint Specific Models ---

# Add request model for /calculate/natal
class CalculateNatalChartRequest(BaseModel):
    """Schema for the request body for calculating a natal chart."""
    name: str
    year: int
    month: int
    day: int
    hour: int
    minute: int
    city: str

class NatalChartInput(BaseModel): # This seems redundant with CalculateNatalChartRequest?
    """Input for the POST /charts/natal/calculate endpoint."""
    birth_datetime: datetime
    city: str
    name: Optional[str] = "Temporary Calculation"
    location_name: Optional[str] = None

# --- Transit Calculation Models ---

# Add request model for /calculate/transits and /{id}/transits
class CalculateTransitsRequest(BaseModel):
    """Schema for the request body for calculating transits."""
    # Define the structure needed for calculating transits
    # If using saved chart, only transit datetime is needed.
    # If calculating from scratch (like /calculate/transits), natal data is needed.
    natal_chart_request: Optional[CalculateNatalChartRequest] = None # For /calculate/transits
    transit_year: int
    transit_month: int
    transit_day: int
    transit_hour: int = 12 # Default to noon if not specified
    transit_minute: int = 0

class TransitingBody(BaseModel):
    name: str
    sign: str
    position: float
    retrograde: Optional[bool] = False
    # Add other relevant fields from calculation

class TransitAspect(BaseModel):
    transiting_planet: str
    natal_planet: str
    aspect_name: str
    orb: float
    # Add other relevant fields

class TransitCalculationResult(BaseModel):
    """Represents the calculated transit data returned by the API."""
    # Update fields based on actual transit calculation output
    natal_chart_info: Optional[Dict[str, Any]] = None # Include basic info about natal chart used
    transit_datetime: datetime
    transiting_planets: Dict[str, TransitingBody]
    aspects_to_natal: List[TransitAspect]
    calculation_error: Optional[str] = None

# Add the missing TransitChartResponse (can inherit from TransitCalculationResult)
class TransitChartResponse(TransitCalculationResult):
    """Response model for transit calculation endpoints."""
    pass

# --- Synastry / Composite Calculation Models ---

# Request model for synastry using existing chart IDs
class CalculateSynastryByIdRequest(BaseModel): # Renamed from CalculateSynastryRequest
    chart1_id: UUID
    chart2_id: UUID

# Request model for composite chart using existing chart IDs
class CalculateCompositeByIdRequest(BaseModel):
    chart1_id: UUID
    chart2_id: UUID

# Reusable input for one person's data for synastry/composite by data
class SynastryCompositePersonInput(BaseModel):
    name: str
    year: int
    month: int
    day: int
    hour: int
    minute: int
    city: str
    latitude: Optional[float] = Field(None, description="Latitude, e.g., 34.0522")
    longitude: Optional[float] = Field(None, description="Longitude, e.g., -118.2437")

# Request model for synastry using two sets of birth data
class CalculateSynastryByDataRequest(BaseModel):
    person1_data: SynastryCompositePersonInput
    person2_data: SynastryCompositePersonInput

# Request model for composite chart using two sets of birth data
class CalculateCompositeByDataRequest(BaseModel):
    person1_data: SynastryCompositePersonInput
    person2_data: SynastryCompositePersonInput

class SynastryAspect(BaseModel):
    planet1: str  # Name of the planet/point in the first chart
    planet2: str  # Name of the planet/point in the second chart
    aspect_name: str # e.g., "Trine", "Square"
    orb: float    # Orb of the aspect in degrees

class SynastryResult(BaseModel):
    chart1_name: str
    chart2_name: str
    chart1_id: Optional[UUID] = None # Populated if by ID
    chart2_id: Optional[UUID] = None # Populated if by ID
    aspects: List[SynastryAspect]
    # Optionally include summaries or full natal data for context
    # chart1_details: Optional[NatalChartData] = None
    # chart2_details: Optional[NatalChartData] = None
    calculation_error: Optional[str] = None

# Model for Composite Chart data (similar to NatalChartData)
class CompositeChartData(BaseModel):
    info: NatalChartInfo # Can store names of the two people or a generic "Composite of X and Y"
    planets: Dict[str, CelestialBody]
    houses: List[HouseCusp] # Houses of the composite chart
    aspects: List[Aspect]   # Aspects within the composite chart
    calculation_error: Optional[str] = None

class CompositeChartResult(BaseModel):
    chart1_name: str
    chart2_name: str
    chart1_id: Optional[UUID] = None # Populated if by ID
    chart2_id: Optional[UUID] = None # Populated if by ID
    composite_chart_data: CompositeChartData
    calculation_error: Optional[str] = None

# Add the missing ChartUpdate schema
class ChartUpdate(BaseModel):
    """Schema for updating an existing chart. All fields are optional."""
    name: Optional[str] = None
    birth_datetime: Optional[datetime] = None
    city: Optional[str] = None
    location_name: Optional[str] = None
    # user_id should generally not be updatable
    user_id: Optional[UUID] = Field(default=None, exclude=True) # Exclude from update payload

class TransitCalculationRequest(BaseModel):
    transit_year: int
    transit_month: int
    transit_day: int
    transit_hour: int
    transit_minute: int
