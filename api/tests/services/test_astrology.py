import pytest
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from unittest.mock import patch, MagicMock, PropertyMock

# Module to be tested
from app.services import astrology as astrology_service
from app.services.astrology import calculate_transits, KERYKEION_AVAILABLE, AstrologicalSubject, KerykeionException, PLANET_MAP, SIGN_FULL_NAMES, SIGN_SYMBOLS

# Helper to create a mock Kerykeion planet object
def _get_mock_planet_obj(abs_pos: float, sign_num: int, position: float, retrograde: bool = False):
    mock_planet = MagicMock()
    mock_planet.abs_pos = abs_pos
    mock_planet.sign_num = sign_num
    mock_planet.position = position
    mock_planet.retrograde = retrograde
    return mock_planet

@pytest.fixture
def sample_natal_chart_data() -> Dict[str, Any]:
    """Provides sample natal chart data, focusing on the 'planets' and 'info' parts."""
    return {
        "info": {
            "name": "Test Natal Chart",
            "lat": 34.0522,  # Los Angeles
            "lon": -118.2437,
            "city": "Los Angeles"
        },
        "planets": {
            "Sun": {"name": "Sun", "longitude": 15.0},       # Aries 15°
            "Moon": {"name": "Moon", "longitude": 75.0},      # Gemini 15°
            "Mars": {"name": "Mars", "longitude": 125.0},     # Leo 5°
        }
    }

@pytest.fixture
def mock_transit_subject_planets() -> Dict[str, Any]:
    """Provides a dictionary to set as attributes on the mocked AstrologicalSubject for transits."""
    return {
        'sun': _get_mock_planet_obj(abs_pos=45.0, sign_num=1, position=15.0),    # Taurus 15°
        'moon': _get_mock_planet_obj(abs_pos=122.0, sign_num=4, position=2.0),   # Leo 2°
        'mercury': _get_mock_planet_obj(abs_pos=30.0, sign_num=1, position=0.0), # Taurus 0°
    }

# --- Tests for calculate_transits ---

def test_calculate_transits_success(sample_natal_chart_data, mock_transit_subject_planets):
    """Test successful transit calculation with mocked Kerykeion."""
    transit_dt = datetime(2024, 7, 29, 12, 0, 0, tzinfo=timezone.utc)

    with patch.object(astrology_service, 'KERYKEION_AVAILABLE', True), \
         patch.object(astrology_service, 'TIMEZONEFINDER_AVAILABLE', True), \
         patch('app.services.astrology.TimezoneFinder') as MockTimezoneFinder, \
         patch('app.services.astrology.AstrologicalSubject') as MockAstrologicalSubject:

        # Configure TimezoneFinder mock
        mock_tf_instance = MockTimezoneFinder.return_value
        mock_tf_instance.timezone_at.return_value = "America/Los_Angeles"

        # Configure AstrologicalSubject mock for transit
        mock_transit_subject_instance = MockAstrologicalSubject.return_value
        # Set only the planet attributes needed
        for planet_name, planet_obj in mock_transit_subject_planets.items():
            setattr(mock_transit_subject_instance, planet_name, planet_obj)
        # Do not set other planet attributes at all

        result = calculate_transits(
            natal_chart_data=sample_natal_chart_data,
            transit_dt=transit_dt
        )

        assert "error" not in result
        assert result["transit_date"] == transit_dt.isoformat()
        
        # Check transiting planets
        assert "Sun" in result["transiting_planets"]
        assert result["transiting_planets"]["Sun"]["longitude"] == 45.0
        assert result["transiting_planets"]["Sun"]["sign"] == "Taurus" # Based on sign_num=1

        assert "Moon" in result["transiting_planets"]
        assert result["transiting_planets"]["Moon"]["longitude"] == 122.0
        assert result["transiting_planets"]["Moon"]["sign"] == "Leo" # Based on sign_num=4
        
        assert "Mercury" in result["transiting_planets"]
        assert result["transiting_planets"]["Mercury"]["longitude"] == 30.0
        assert result["transiting_planets"]["Mercury"]["sign"] == "Taurus" # Based on sign_num=1

        # Check aspects (example: Transiting Sun at 45° Taurus, Natal Sun at 15° Aries)
        # Angle diff = 30°. Expect Sextile (orb <= 5.0 if standard orb for sextile) or SemiSextile (orb <=2.0)
        # ASPECT_DEGREES_ORBS: "Sextile": (60, 5.0), "SemiSextile": (30, 2.0)
        # So, this should be a SemiSextile with orb 0.0
        found_sun_sun_semisextile = False
        for aspect in result["transit_aspects"]:
            if aspect["transiting_planet"] == "Sun" and \
               aspect["natal_planet"] == "Sun" and \
               aspect["aspect_name"] == "SemiSextile":
                assert aspect["orb"] == 0.0 
                found_sun_sun_semisextile = True
                break
        assert found_sun_sun_semisextile, "Expected SemiSextile between Transiting Sun and Natal Sun"

        # Example 2: Transiting Moon (122° Leo) to Natal Mars (125° Leo)
        # Angle diff = 3°. Expect Conjunction (orb <= 8.0)
        # ASPECT_DEGREES_ORBS: "Conjunction": (0, 8.0) -> Here, angle diff is 3, orb is 3.
        found_moon_mars_conjunction = False
        for aspect in result["transit_aspects"]:
            if aspect["transiting_planet"] == "Moon" and \
               aspect["natal_planet"] == "Mars" and \
               aspect["aspect_name"] == "Conjunction":
                assert aspect["orb"] == 3.0
                found_moon_mars_conjunction = True
                break
        assert found_moon_mars_conjunction, "Expected Conjunction between Transiting Moon and Natal Mars"
        
        # Verify location used was from natal_chart_data["info"]
        MockAstrologicalSubject.assert_called_once_with(
            name="Transit",
            year=transit_dt.year, month=transit_dt.month, day=transit_dt.day,
            hour=transit_dt.hour, minute=transit_dt.minute,
            city="Los Angeles", # From sample_natal_chart_data
            lng=-118.2437,      # From sample_natal_chart_data
            lat=34.0522,        # From sample_natal_chart_data
            tz_str="America/Los_Angeles"
        )

def test_calculate_transits_kerykeion_unavailable(sample_natal_chart_data):
    """Test transit calculation when Kerykeion is marked as unavailable."""
    transit_dt = datetime(2024, 7, 29, 12, 0, 0, tzinfo=timezone.utc)
    with patch.object(astrology_service, 'KERYKEION_AVAILABLE', False):
        result = calculate_transits(sample_natal_chart_data, transit_dt)
        assert "error" in result
        assert result["error"] == "Kerykeion library not available."

def test_calculate_transits_malformed_natal_data(mock_transit_subject_planets):
    """Test transit calculation when natal_chart_data['planets'] is malformed."""
    transit_dt = datetime(2024, 7, 29, 12, 0, 0, tzinfo=timezone.utc)
    malformed_natal_data = {
        "info": {"lat": 0.0, "lon": 0.0, "city": "TestCity"},
        "planets": {"Sun": {"name": "Sun"}} # Missing 'longitude'
    }
    
    with patch.object(astrology_service, 'KERYKEION_AVAILABLE', True), \
         patch.object(astrology_service, 'TIMEZONEFINDER_AVAILABLE', True), \
         patch('app.services.astrology.TimezoneFinder'), \
         patch('app.services.astrology.AstrologicalSubject') as MockAstrologicalSubject:
        mock_transit_subject_instance = MockAstrologicalSubject.return_value
        for planet_name, planet_obj in mock_transit_subject_planets.items():
            setattr(mock_transit_subject_instance, planet_name, planet_obj)
        result = calculate_transits(malformed_natal_data, transit_dt)
        assert "error" in result
        assert result["error"] == "Natal planets data malformed."
        assert "transit_date" in result # Should still include transit_date
        assert "transiting_planets" in result # Should still attempt to calculate these


def test_calculate_transits_location_override(sample_natal_chart_data, mock_transit_subject_planets):
    """Test that explicitly passed target location overrides natal chart location."""
    transit_dt = datetime(2024, 7, 29, 12, 0, 0, tzinfo=timezone.utc)
    override_lat = 40.7128  # New York
    override_lon = -74.0060
    override_city = "New York"

    with patch.object(astrology_service, 'KERYKEION_AVAILABLE', True), \
         patch.object(astrology_service, 'TIMEZONEFINDER_AVAILABLE', True), \
         patch('app.services.astrology.TimezoneFinder') as MockTimezoneFinder, \
         patch('app.services.astrology.AstrologicalSubject') as MockAstrologicalSubject:

        mock_tf_instance = MockTimezoneFinder.return_value
        mock_tf_instance.timezone_at.return_value = "America/New_York" # Expected for NY

        mock_transit_subject_instance = MockAstrologicalSubject.return_value
        for planet_name, planet_obj in mock_transit_subject_planets.items():
            setattr(mock_transit_subject_instance, planet_name, planet_obj)
        result = calculate_transits(
            natal_chart_data=sample_natal_chart_data,
            transit_dt=transit_dt,
            target_latitude=override_lat,
            target_longitude=override_lon,
            target_city=override_city
        )

        assert "error" not in result
        MockAstrologicalSubject.assert_called_once_with(
            name="Transit",
            year=transit_dt.year, month=transit_dt.month, day=transit_dt.day,
            hour=transit_dt.hour, minute=transit_dt.minute,
            city=override_city,
            lng=override_lon,
            lat=override_lat,
            tz_str="America/New_York"
        )

def test_calculate_transits_default_location_when_no_info(sample_natal_chart_data, mock_transit_subject_planets):
    """Test that default location is used if no target and no natal info is present."""
    transit_dt = datetime(2024, 7, 29, 12, 0, 0, tzinfo=timezone.utc)
    natal_data_no_loc = {
        "info": {"name": "Chart Without Location"}, # No lat/lon/city in info
        "planets": sample_natal_chart_data["planets"]
    }

    with patch.object(astrology_service, 'KERYKEION_AVAILABLE', True), \
         patch.object(astrology_service, 'TIMEZONEFINDER_AVAILABLE', True), \
         patch('app.services.astrology.TimezoneFinder') as MockTimezoneFinder, \
         patch('app.services.astrology.AstrologicalSubject') as MockAstrologicalSubject:
        mock_tf_instance = MockTimezoneFinder.return_value
        mock_tf_instance.timezone_at.return_value = "Etc/UTC" # Example for default location
        mock_transit_subject_instance = MockAstrologicalSubject.return_value
        for planet_name, planet_obj in mock_transit_subject_planets.items():
            setattr(mock_transit_subject_instance, planet_name, planet_obj)
        result = calculate_transits(
            natal_chart_data=natal_data_no_loc,
            transit_dt=transit_dt
        )
        assert "error" not in result
        MockAstrologicalSubject.assert_called_once_with(
            name="Transit",
            year=transit_dt.year, month=transit_dt.month, day=transit_dt.day,
            hour=transit_dt.hour, minute=transit_dt.minute,
            city="DefaultLocation", # Expected default
            lng=0.0,               # Expected default
            lat=0.0,               # Expected default
            tz_str="Etc/UTC"       # Based on mock for default location
        )
        
def test_calculate_transits_kerykeion_initialization_error(sample_natal_chart_data):
    transit_dt = datetime(2024, 7, 29, 12, 0, 0, tzinfo=timezone.utc)
    with patch.object(astrology_service, 'KERYKEION_AVAILABLE', True), \
         patch.object(astrology_service, 'TIMEZONEFINDER_AVAILABLE', True), \
         patch('app.services.astrology.TimezoneFinder'), \
         patch('app.services.astrology.AstrologicalSubject', side_effect=KerykeionException("Init failed")) as MockAstrologicalSubject:
        
        result = calculate_transits(sample_natal_chart_data, transit_dt)
        assert "error" in result
        assert "Kerykeion Initialization Error for transit: Init failed" in result["error"] 

def test_calculate_transits_all_planets_missing(sample_natal_chart_data):
    """Test that calculate_transits handles missing planet attributes in transit subject gracefully."""
    transit_dt = datetime(2024, 7, 29, 12, 0, 0, tzinfo=timezone.utc)
    with patch.object(astrology_service, 'KERYKEION_AVAILABLE', True), \
         patch.object(astrology_service, 'TIMEZONEFINDER_AVAILABLE', True), \
         patch('app.services.astrology.TimezoneFinder'), \
         patch('app.services.astrology.AstrologicalSubject') as MockAstrologicalSubject:
        mock_transit_subject_instance = MockAstrologicalSubject.return_value
        # Do not set any planet attributes at all
        result = calculate_transits(sample_natal_chart_data, transit_dt)
        assert "error" not in result
        # Should return empty transiting_planets
        assert result["transiting_planets"] == {}
        # Should return empty aspects
        assert result["transit_aspects"] == []

def test_calculate_transits_extreme_date(sample_natal_chart_data, mock_transit_subject_planets):
    """Test calculate_transits with an extreme date (far future)."""
    transit_dt = datetime(2500, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    with patch.object(astrology_service, 'KERYKEION_AVAILABLE', True), \
         patch.object(astrology_service, 'TIMEZONEFINDER_AVAILABLE', True), \
         patch('app.services.astrology.TimezoneFinder') as MockTimezoneFinder, \
         patch('app.services.astrology.AstrologicalSubject') as MockAstrologicalSubject:
        mock_tf_instance = MockTimezoneFinder.return_value
        mock_tf_instance.timezone_at.return_value = "UTC"
        mock_transit_subject_instance = MockAstrologicalSubject.return_value
        for planet_name, planet_obj in mock_transit_subject_planets.items():
            setattr(mock_transit_subject_instance, planet_name, planet_obj)
        result = calculate_transits(sample_natal_chart_data, transit_dt)
        assert "error" not in result
        assert result["transit_date"].startswith("2500-")

def test_calculate_transits_all_aspect_types(sample_natal_chart_data):
    """Test that all aspect types are detected if present."""
    # Use real planet names for both natal and transit
    aspect_degrees = {
        "Conjunction": 0, "Sextile": 60, "Square": 90, "Trine": 120, "Opposition": 180,
        "Quincunx": 150, "SemiSextile": 30, "SemiSquare": 45, "Sesquiquadrate": 135
    }
    # Map each aspect to a real planet name
    planet_names = [
        'sun', 'moon', 'mercury', 'venus', 'mars',
        'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
        'mean_node', 'true_node', 'chiron', 'mean_lilith'
    ]
    natal_planets = {}
    transit_planets = {}
    for (aspect, deg), planet_name in zip(aspect_degrees.items(), planet_names):
        natal_planets[planet_name.capitalize()] = {"name": planet_name.capitalize(), "longitude": 0.0}
        transit_planets[planet_name] = _get_mock_planet_obj(abs_pos=deg, sign_num=0, position=deg)
    natal_data = {"info": {"lat": 0.0, "lon": 0.0, "city": "TestCity"}, "planets": natal_planets}
    transit_dt = datetime(2024, 7, 29, 12, 0, 0, tzinfo=timezone.utc)
    with patch.object(astrology_service, 'KERYKEION_AVAILABLE', True), \
         patch.object(astrology_service, 'TIMEZONEFINDER_AVAILABLE', True), \
         patch('app.services.astrology.TimezoneFinder'), \
         patch('app.services.astrology.AstrologicalSubject') as MockAstrologicalSubject:
        mock_transit_subject_instance = MockAstrologicalSubject.return_value
        for planet_name, planet_obj in transit_planets.items():
            setattr(mock_transit_subject_instance, planet_name, planet_obj)
        result = calculate_transits(natal_data, transit_dt)
        found_aspects = set(a["aspect_name"] for a in result["transit_aspects"])
        for aspect in aspect_degrees:
            assert aspect in found_aspects

def test_calculate_transits_timezonefinder_unavailable(sample_natal_chart_data, mock_transit_subject_planets):
    """Test fallback when TIMEZONEFINDER is unavailable."""
    transit_dt = datetime(2024, 7, 29, 12, 0, 0, tzinfo=timezone.utc)
    with patch.object(astrology_service, 'KERYKEION_AVAILABLE', True), \
         patch.object(astrology_service, 'TIMEZONEFINDER_AVAILABLE', False), \
         patch('app.services.astrology.AstrologicalSubject') as MockAstrologicalSubject:
        mock_transit_subject_instance = MockAstrologicalSubject.return_value
        for planet_name, planet_obj in mock_transit_subject_planets.items():
            setattr(mock_transit_subject_instance, planet_name, planet_obj)
        result = calculate_transits(sample_natal_chart_data, transit_dt)
        assert "error" not in result
        # tz_str should be None, but calculation should proceed
        assert result["transit_date"] == transit_dt.isoformat()

def test_calculate_transits_retrograde_planet(sample_natal_chart_data):
    """Test that retrograde status is reflected in output."""
    transit_dt = datetime(2024, 7, 29, 12, 0, 0, tzinfo=timezone.utc)
    retro_planet = _get_mock_planet_obj(abs_pos=100.0, sign_num=3, position=10.0, retrograde=True)
    with patch.object(astrology_service, 'KERYKEION_AVAILABLE', True), \
         patch.object(astrology_service, 'TIMEZONEFINDER_AVAILABLE', True), \
         patch('app.services.astrology.TimezoneFinder'), \
         patch('app.services.astrology.AstrologicalSubject') as MockAstrologicalSubject:
        mock_transit_subject_instance = MockAstrologicalSubject.return_value
        mock_transit_subject_instance.sun = retro_planet
        result = calculate_transits(sample_natal_chart_data, transit_dt)
        assert "error" not in result
        assert result["transiting_planets"]["Sun"]["is_retrograde"] is True

def test_calculate_transits_output_format_consistency(sample_natal_chart_data, mock_transit_subject_planets):
    """Test that output always contains required keys, even on error."""
    transit_dt = datetime(2024, 7, 29, 12, 0, 0, tzinfo=timezone.utc)
    # Malformed natal data triggers error
    malformed_natal_data = {"info": {}, "planets": {"Sun": {"name": "Sun"}}}
    with patch.object(astrology_service, 'KERYKEION_AVAILABLE', True), \
         patch.object(astrology_service, 'TIMEZONEFINDER_AVAILABLE', True), \
         patch('app.services.astrology.TimezoneFinder'), \
         patch('app.services.astrology.AstrologicalSubject') as MockAstrologicalSubject:
        mock_transit_subject_instance = MockAstrologicalSubject.return_value
        mock_transit_subject_instance.sun = _get_mock_planet_obj(abs_pos=10.0, sign_num=0, position=10.0)
        result = calculate_transits(malformed_natal_data, transit_dt)
        assert "transit_date" in result
        assert "transiting_planets" in result
        assert "transit_aspects" in result 