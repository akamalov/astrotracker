# Simplified for debugging import issues - Step 9 (Restore 4th Endpoint)

from fastapi import APIRouter, Depends, HTTPException, Query, Path
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
import logging
from datetime import datetime
from functools import partial
from multiprocessing.pool import Pool
from fastapi.concurrency import run_in_threadpool

# Reverted to absolute imports now that schemas directory exists
from app.schemas.chart import (
    NatalChartData,
    ChartCreate,
    ChartRead,
    ChartUpdate,
    TransitChartResponse,
    SynastryChartResponse,
    CompositeChartResponse,
    ChartDisplay,
    CalculateNatalChartRequest,
    CalculateTransitsRequest,
    CalculateSynastryRequest,
    CalculateCompositeRequest,
    TransitCalculationRequest,
)
from app.crud import chart as crud_chart
from app.crud.user import get_crud_user
from app.schemas.user import UserCreate
from app.db.session import get_async_session
from app.api.deps import current_active_user
from app.models.user import User
from app.services.astrology import NatalChartCalculator, calculate_transits, calculate_synastry, calculate_composite_chart
from app.services.geolocation import get_coordinates_for_city
from fastapi_users.exceptions import UserNotExists
from fastapi_users.manager import BaseUserManager
from app.db.user_manager import get_user_manager
from app.crud.chart import get_crud_chart, CRUDChart

print(">>> Loading charts.py <<<") # Add a debug print

router = APIRouter()
print(">>> charts.py: router defined <<<")

logger = logging.getLogger(__name__)

# --- Calculation Endpoints (No DB interaction, pure calculation) ---

@router.post("/calculate/natal", response_model=NatalChartData)
async def calculate_natal_chart_endpoint(
    request: CalculateNatalChartRequest,
    db: AsyncSession = Depends(get_async_session),
):
    logger.info(f"Calculating natal chart for: {request.name}")
    try:
        lat, lon = await get_coordinates_for_city(request.city, db)
        if lat is None or lon is None:
            raise HTTPException(status_code=404, detail=f"Coordinates not found for city: {request.city}")

        calculator = NatalChartCalculator(
            name=request.name,
            birth_dt=datetime(request.year, request.month, request.day, request.hour, request.minute),
            city=request.city
        )
        chart_data = await calculator.calculate_chart()
        response_data = NatalChartData(**chart_data)
        logger.info(f"Successfully calculated natal chart for: {request.name}")
        return response_data

    except Exception as e:
        logger.exception(f"Error calculating natal chart for {request.name}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error calculating chart (could be invalid city or other issue): {str(e)}")

@router.post("/calculate/transits", response_model=TransitChartResponse)
async def calculate_transits_endpoint(
    request: CalculateTransitsRequest,
    db: AsyncSession = Depends(get_async_session),
):
    logger.info(f"Calculating transits for: {request.natal_chart_request.name} on {request.transit_year}-{request.transit_month}-{request.transit_day}")
    try:
        if not request.natal_chart_request:
             raise HTTPException(status_code=400, detail="natal_chart_request field is required for this endpoint.")

        lat, lon = await get_coordinates_for_city(request.natal_chart_request.city, db)
        if lat is None or lon is None:
             raise HTTPException(status_code=404, detail=f"Coordinates not found for city: {request.natal_chart_request.city}")

        natal_chart_data_for_calc = {
            "name": request.natal_chart_request.name,
            "year": request.natal_chart_request.year,
            "month": request.natal_chart_request.month,
            "day": request.natal_chart_request.day,
            "hour": request.natal_chart_request.hour,
            "minute": request.natal_chart_request.minute,
            "city": request.natal_chart_request.city,
            "latitude": lat,
            "longitude": lon,
        }

        try:
            transit_dt = datetime(
                request.transit_year, request.transit_month, request.transit_day,
                request.transit_hour, request.transit_minute
            )
        except ValueError as ve:
             raise HTTPException(status_code=400, detail=f"Invalid transit date/time provided: {ve}")

        transit_data = await calculate_transits(natal_chart_data=natal_chart_data_for_calc, transit_dt=transit_dt)

        response_data = TransitChartResponse(**transit_data)
        logger.info(f"Successfully calculated transits for: {request.natal_chart_request.name}")
        return response_data

    except Exception as e:
        logger.exception(f"Error calculating transits for {request.natal_chart_request.name}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error calculating transits (could be invalid city or other issue): {str(e)}")

@router.post("/", response_model=ChartDisplay, status_code=201)
async def create_chart_endpoint(
    *,
    chart_crud: "CRUDChart" = Depends(get_crud_chart),
    user_crud = Depends(get_crud_user), # Instance of SQLAlchemyUserDatabase
    user_manager: BaseUserManager[User, uuid.UUID] = Depends(get_user_manager), # Inject UserManager
    chart_in: ChartCreate,
    db: AsyncSession = Depends(get_async_session), # Inject session separately
):
    """Create a new chart."""
    logger.info(f"Creating chart: {chart_in.name} - Auth disabled, using temp user logic")

    # --- TEMPORARY DUMMY USER LOGIC (MANUAL CREATION WORKAROUND) ---
    user_id_to_use: UUID
    dummy_email = "temp@example.com"
    dummy_password = "dummyPassword123!"

    async def _create_dummy_user(session: AsyncSession, manager: BaseUserManager[User, uuid.UUID]):
        """Helper to manually create the dummy user."""
        nonlocal user_id_to_use
        dummy_user_in_schema = UserCreate(email=dummy_email, password=dummy_password)
        hashed_password = manager.password_helper.hash(dummy_user_in_schema.password)
        user_db = User(
            email=dummy_user_in_schema.email,
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=False,
            is_verified=False,
        )
        session.add(user_db)
        await session.commit()
        await session.refresh(user_db)
        user_id_to_use = user_db.id
        logger.info(f"Manually created dummy user with ID: {user_id_to_use}")
        return user_db

    try:
        existing_user = await user_crud.get_by_email(dummy_email)
        if existing_user:
            user_id_to_use = existing_user.id
            logger.info(f"Using existing dummy user ID: {user_id_to_use} for email {dummy_email}")
        else:
            logger.info(f"Dummy user {dummy_email} not found via get_by_email (returned None), attempting manual creation.")
            await _create_dummy_user(db, user_manager)

    except UserNotExists:
        logger.info(f"Dummy user {dummy_email} not found (UserNotExists), attempting manual creation.")
        try:
            await _create_dummy_user(db, user_manager)
        except Exception as creation_e:
            logger.error(f"Error MANUALLY CREATING dummy user after not found: {creation_e}", exc_info=True)
            await db.rollback()
            raise HTTPException(status_code=500, detail="Error creating dummy user.")

    except Exception as user_e:
        logger.error(f"Error during dummy user check/creation logic: {user_e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error preparing user for chart creation.")
    # --- END TEMPORARY DUMMY USER LOGIC ---

    # --- Geocode city and set coordinates ---
    lat, lon = await get_coordinates_for_city(chart_in.city, db)
    if lat is None or lon is None:
        logger.error(f"Could not geocode city: {chart_in.city}")
        raise HTTPException(status_code=400, detail=f"Could not geocode city: {chart_in.city}")

    chart_in = chart_in.copy(update={"latitude": lat, "longitude": lon})

    try:
        new_chart = await chart_crud.create(
            obj_in=chart_in, user_id=user_id_to_use
        )
    except Exception as e:
        logger.error(f"Error creating chart in DB: {e}", exc_info=True)
        if "violates foreign key constraint" in str(e) and "user_id" in str(e):
             logger.error(f"IntegrityError: Attempted to create chart with non-existent user_id: {user_id_to_use}")
             raise HTTPException(status_code=400, detail=f"User ID {user_id_to_use} not found. Cannot create chart.")
        raise HTTPException(status_code=500, detail="Error saving chart to database.")

    return ChartDisplay.model_validate(new_chart)


@router.get("/", response_model=List[ChartDisplay])
async def read_charts_endpoint(
    chart_crud: "CRUDChart" = Depends(get_crud_chart),
    skip: int = 0,
    limit: int = 100,
):
    logger.info(f"Requesting charts (skip={skip}, limit={limit}) - Auth disabled for testing")
    charts = await chart_crud.get_multi(skip=skip, limit=limit)
    return [ChartDisplay.model_validate(chart) for chart in charts]


@router.get("/{chart_id}")
async def read_chart_endpoint(
    *,
    chart_crud: "CRUDChart" = Depends(get_crud_chart),
    chart_id: UUID = Path(..., title="The ID of the chart to get"),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Retrieve a specific chart by ID, including calculated astrological details.
    """
    logger.info(f"Requesting chart with ID: {chart_id} - Auth disabled for testing")
    chart = await chart_crud.get(id=chart_id)
    if not chart:
        logger.warning(f"Chart with ID {chart_id} not found in DB.")
        raise HTTPException(status_code=404, detail="Chart not found")

    # --- ADDED Astrological Calculation ---    
    calculated_astro_data: Dict[str, Any] = {} 
    error_detail = None
    try:
        if not chart.birth_datetime or not chart.city:
            raise ValueError("Stored chart is missing birth datetime or city for calculation.")

        # Get coordinates
        lat, lon = await get_coordinates_for_city(chart.city, db)
        if lat is None or lon is None:
            raise ValueError(f"Could not retrieve coordinates for city: {chart.city}")

        # Instantiate calculator, passing coordinates to __init__
        calculator = NatalChartCalculator(
            name=chart.name, 
            birth_dt=chart.birth_datetime, 
            city=chart.city,
            latitude=lat, 
            longitude=lon
        )
        # Perform calculation (call without arguments now)
        calculated_astro_data = await calculator.calculate_chart()
        logger.info(f"Successfully calculated astrological data for chart ID: {chart_id}")

    except Exception as calc_e:
        logger.error(f"Error calculating astrological data for chart ID {chart_id}: {calc_e}", exc_info=True)
        error_detail = f"Could not calculate astrological details: {str(calc_e)}" 
    # --- END Calculation ---
    
    chart_db_data = ChartDisplay.model_validate(chart).model_dump()

    response_data = {
        **chart_db_data, 
        "astrological_data": calculated_astro_data,
        "calculation_error": error_detail
    }

    logger.info(f"Successfully retrieved and processed chart with ID: {chart_id}")
    return response_data


@router.delete("/{chart_id}", response_model=ChartDisplay)
async def delete_chart_endpoint(
    *,
    chart_crud: "CRUDChart" = Depends(get_crud_chart),
    chart_id: UUID = Path(..., title="The ID of the chart to delete"),
    # db: AsyncSession = Depends(get_async_session), # Not strictly needed if crud handles session
    # current_user: User = Depends(current_active_user), # Add back when auth is enabled
):
    """
    Delete a specific chart by ID.
    """
    logger.info(f"Request to delete chart with ID: {chart_id} - Auth disabled")
    # TODO: Add check: Ensure current_user owns the chart before deleting when auth is added.
    
    deleted_chart = await chart_crud.remove(id=chart_id)
    
    if not deleted_chart:
        logger.warning(f"Chart with ID {chart_id} not found for deletion.")
        raise HTTPException(status_code=404, detail="Chart not found")

    logger.info(f"Successfully deleted chart with ID: {chart_id}")
    # Return the deleted chart data
    return ChartDisplay.model_validate(deleted_chart)


@router.post("/{chart_id}/transits", response_model=TransitChartResponse)
async def get_chart_transits_endpoint(
    chart_id: UUID,
    request: TransitCalculationRequest,
    chart_crud: CRUDChart = Depends(get_crud_chart),
    db: AsyncSession = Depends(get_async_session),
):
    # 1. Fetch the chart
    chart = await chart_crud.get(id=chart_id)
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")

    # 2. Get coordinates
    lat = chart.latitude
    lon = chart.longitude
    city = chart.city
    if lat is None or lon is None:
        lat, lon = await get_coordinates_for_city(city, db)
        if lat is None or lon is None:
            raise HTTPException(status_code=404, detail="Coordinates not found for chart's city")

    # 3. Prepare transit datetime
    transit_dt = datetime(
        request.transit_year,
        request.transit_month,
        request.transit_day,
        request.transit_hour,
        request.transit_minute
    )

    # 4. Calculate natal chart data using NatalChartCalculator
    calculator = NatalChartCalculator(
        name=chart.name,
        birth_dt=chart.birth_datetime,
        city=chart.city,
        latitude=lat,
        longitude=lon
    )
    natal_chart_data = await calculator.calculate_chart()

    # 5. Call calculate_transits in threadpool (sync function)
    transit_data = await run_in_threadpool(
        calculate_transits,
        natal_chart_data,
        transit_dt,
        lat,
        lon,
        city
    )

    return TransitChartResponse(**transit_data)


@router.post("/synastry", response_model=SynastryChartResponse)
async def calculate_synastry_endpoint(
    request: CalculateSynastryRequest,
    chart_crud: CRUDChart = Depends(get_crud_chart),
    db: AsyncSession = Depends(get_async_session),
):
    # Fetch both charts
    chart1 = await chart_crud.get(id=request.chart1_id)
    chart2 = await chart_crud.get(id=request.chart2_id)
    if not chart1 or not chart2:
        raise HTTPException(status_code=404, detail="One or both charts not found")
    # Calculate natal chart data for both
    calc1 = NatalChartCalculator(
        name=chart1.name,
        birth_dt=chart1.birth_datetime,
        city=chart1.city,
        latitude=chart1.latitude,
        longitude=chart1.longitude
    )
    natal1 = await calc1.calculate_chart()
    calc2 = NatalChartCalculator(
        name=chart2.name,
        birth_dt=chart2.birth_datetime,
        city=chart2.city,
        latitude=chart2.latitude,
        longitude=chart2.longitude
    )
    natal2 = await calc2.calculate_chart()
    # Calculate synastry (sync, so use run_in_threadpool)
    synastry_data = await run_in_threadpool(calculate_synastry, natal1, natal2)
    return SynastryChartResponse(
        chart1_id=request.chart1_id,
        chart1_name=chart1.name,
        chart2_id=request.chart2_id,
        chart2_name=chart2.name,
        aspects=synastry_data.get("aspects", []),
        calculation_error=synastry_data.get("error")
    )

@router.post("/composite", response_model=CompositeChartResponse)
async def calculate_composite_endpoint(
    request: CalculateCompositeRequest,
    chart_crud: CRUDChart = Depends(get_crud_chart),
    db: AsyncSession = Depends(get_async_session),
):
    # Fetch both charts
    chart1 = await chart_crud.get(id=request.chart1_id)
    chart2 = await chart_crud.get(id=request.chart2_id)
    if not chart1 or not chart2:
        raise HTTPException(status_code=404, detail="One or both charts not found")
    # Calculate natal chart data for both
    calc1 = NatalChartCalculator(
        name=chart1.name,
        birth_dt=chart1.birth_datetime,
        city=chart1.city,
        latitude=chart1.latitude,
        longitude=chart1.longitude
    )
    natal1 = await calc1.calculate_chart()
    calc2 = NatalChartCalculator(
        name=chart2.name,
        birth_dt=chart2.birth_datetime,
        city=chart2.city,
        latitude=chart2.latitude,
        longitude=chart2.longitude
    )
    natal2 = await calc2.calculate_chart()
    # Calculate composite (sync, so use run_in_threadpool)
    composite_data = await run_in_threadpool(calculate_composite_chart, natal1, natal2)
    return CompositeChartResponse(
        chart1_id=request.chart1_id,
        chart1_name=chart1.name,
        chart2_id=request.chart2_id,
        chart2_name=chart2.name,
        composite_planets=composite_data.get("composite_planets"),
        calculation_error=composite_data.get("error")
    )

# @router.put("/{chart_id}", response_model=ChartDisplay)
# async def update_chart_endpoint(...):
#     ...

# ... (rest of endpoints remain commented) ...
