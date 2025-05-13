# tests/utils/chart.py
from datetime import datetime, timezone

# Sample valid data for /calculate endpoint (Legacy - keep for reference?)
original_sample_calculate_data_valid = {
    "chart_type": "natal",
    "datetime_utc": datetime(1990, 5, 15, 12, 0, 0, tzinfo=timezone.utc).isoformat(),
    "latitude": 34.0522,
    "longitude": -118.2437,
    "location_name": "Los Angeles, CA"
}

# Sample valid data for natal chart with timezone offset (Legacy)
original_sample_calculate_data_natal_tz = {
    "chart_type": "natal",
    "datetime_utc": "1985-07-20T10:30:00+02:00", # Example with timezone
    "latitude": 48.8566,
    "longitude": 2.3522,
    "location_name": "Paris, France"
}

# --- MOCK DATA FOR V1 ENDPOINT (/api/v1/charts/calculate/natal) ---

# Mocked successful calculation result matching NatalChartData schema
mock_natal_calc_result_success = {
    "info": {
        "name": "Test Natal Calc", # Name from the request
        "birth_datetime": "1990-05-15T12:00:00", # ISO format from request datetime
        "location": "Los Angeles, CA", # City from the request
        "kerykeion_sun_sign": "Taurus", # Example placeholder
        "kerykeion_asc_sign": "Leo" # Example placeholder
    },
    "planets": {
        "Sun": {"name": "Sun", "sign": "Taurus", "sign_num": 2, "position": 24.5, "absolute_position": 54.5, "house": "10"},
        "Moon": {"name": "Moon", "sign": "Leo", "sign_num": 5, "position": 15.2, "absolute_position": 135.2, "house": "1"},
        # Add other planets as needed...
    },
    "houses": [
        {"cusp": 1, "sign": "Leo", "sign_num": 5, "position": 10.0, "absolute_position": 130.0},
        {"cusp": 2, "sign": "Virgo", "sign_num": 6, "position": 5.5, "absolute_position": 155.5},
        # Add other house cusps (up to 12)
    ],
    "aspects": [
        {"p1_name": "Sun", "p2_name": "Moon", "aspect_name": "Square", "orb": 1.5, "aspect_degrees": 90}
        # Add other aspects
    ],
    "calculation_error": None
}

# --- Legacy Invalid Data Samples (Keep for reference?) ---

# Sample data for invalid chart type (Legacy)
sample_calculate_data_invalid_chart_type = original_sample_calculate_data_valid.copy()
sample_calculate_data_invalid_chart_type["chart_type"] = "invalid_type"

# Sample data for invalid datetime format (Legacy)
sample_calculate_data_invalid_datetime = original_sample_calculate_data_valid.copy()
sample_calculate_data_invalid_datetime["datetime_utc"] = "not-a-date"

# Sample data for out-of-range latitude (Legacy)
sample_calculate_data_invalid_lat = original_sample_calculate_data_valid.copy()
sample_calculate_data_invalid_lat["latitude"] = 91.0

# Sample data for out-of-range longitude (Legacy)
sample_calculate_data_invalid_lon = original_sample_calculate_data_valid.copy()
sample_calculate_data_invalid_lon["longitude"] = -181.0 