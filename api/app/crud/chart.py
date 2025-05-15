# /app/crud/chart.py
from typing import Any, Dict, Optional, Union, List
from uuid import UUID
import logging # Import logging

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update

from app.db.session import get_async_session
from app.models.chart import Chart
from app.schemas.chart import ChartCreate, ChartUpdate

# Import Kerykeion components from the service layer to respect availability checks
from app.services.astrology import (
    _AstrologicalSubject, 
    _KerykeionException, 
    KERYKEION_AVAILABLE,
    NatalChartCalculator # For type hinting if needed, or direct use if making a new subject
)
# Need city to lat/lon conversion if not already on chart_db
from app.services.geolocation import get_coordinates_for_city

logger = logging.getLogger(__name__) # Get logger for this module

# Placeholder implementation - Modified for session injection
class CRUDChart:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, id: UUID) -> Optional[Chart]:
        result = await self.db.execute(select(Chart).filter(Chart.id == id))
        return result.scalars().first()

    async def get_multi(
        self, *, skip: int = 0, limit: int = 100
    ) -> List[Chart]:
        result = await self.db.execute(
            select(Chart)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_multi_by_owner(
        self, *, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Chart]:
        result = await self.db.execute(
            select(Chart).filter(Chart.user_id == user_id).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def create(self, *, obj_in: ChartCreate, user_id: UUID) -> Chart:
        """Create a new chart in the database."""
        chart_data = obj_in.model_dump()
        
        if 'birth_datetime' in chart_data and chart_data['birth_datetime']:
            aware_dt = chart_data['birth_datetime']
            logger.info(f"CRUD Create - Original birth_datetime: {aware_dt} (Type: {type(aware_dt)}, TZ: {aware_dt.tzinfo})") # DEBUG LOG
            if aware_dt.tzinfo is not None:
                naive_dt = aware_dt.replace(tzinfo=None)
                logger.info(f"CRUD Create - Attempted naive birth_datetime: {naive_dt} (Type: {type(naive_dt)}, TZ: {naive_dt.tzinfo})") # DEBUG LOG
                chart_data['birth_datetime'] = naive_dt
            else:
                 logger.info(f"CRUD Create - birth_datetime was already naive: {aware_dt}") # DEBUG LOG
        
        db_obj = Chart(
            **chart_data,
            user_id=user_id
        )
        
        self.db.add(db_obj)
        try:
            await self.db.commit()
            await self.db.refresh(db_obj)
            logger.info(f"CRUD Create - Successfully committed chart ID: {db_obj.id}") # DEBUG LOG
            return db_obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"CRUD Create - DB Commit Error: {e}", exc_info=True) # DEBUG LOG
            raise e

    async def update(
        self, *, db_obj: Chart, obj_in: Union[ChartUpdate, Dict[str, Any]]
    ) -> Optional[Chart]:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        
        # Prevent updating the primary key or user_id directly if needed
        update_data.pop("id", None)
        update_data.pop("user_id", None)

        if not update_data: # No valid fields to update
             return db_obj # Return original object or None/raise error?

        await self.db.execute(
            update(Chart).where(Chart.id == db_obj.id).values(**update_data)
        )
        await self.db.commit()
        await self.db.refresh(db_obj) # Refresh the original object
        return db_obj

    async def remove(self, *, id: UUID) -> Optional[Chart]:
        obj = await self.get(id=id)
        if obj:
            await self.db.execute(delete(Chart).where(Chart.id == id))
            await self.db.commit()
            return obj
        return None

    async def get_astrological_subject(self, chart_db: Chart, db: AsyncSession) -> Optional[_AstrologicalSubject]:
        """
        Converts a Chart database model object into a Kerykeion AstrologicalSubject instance.
        Uses latitude and longitude from the chart_db if available, otherwise fetches them.
        """
        if not KERYKEION_AVAILABLE or not _AstrologicalSubject:
            logger.error("Kerykeion library or AstrologicalSubject is not available. Cannot create subject.")
            return None

        if not chart_db:
            logger.error("chart_db object is None, cannot create AstrologicalSubject.")
            return None

        # Ensure all necessary data is present
        if not all([chart_db.name, chart_db.birth_datetime, chart_db.city]):
            logger.error(f"Chart ID {chart_db.id} is missing essential data (name, birth_datetime, or city) for AstrologicalSubject creation.")
            return None
        
        latitude = chart_db.latitude
        longitude = chart_db.longitude

        # If lat/lon are not directly on the chart_db, fetch them
        # This is a common scenario if charts are created without immediate geocoding
        # or if the Chart model doesn't store them directly from creation.
        if latitude is None or longitude is None:
            logger.info(f"Latitude/Longitude not found on chart_db for {chart_db.name}, attempting to fetch from city: {chart_db.city}")
            try:
                lat, lon = await get_coordinates_for_city(chart_db.city, db) # Pass the current session
                if lat is None or lon is None:
                    logger.error(f"Could not geocode city {chart_db.city} for chart ID {chart_db.id}. Cannot create AstrologicalSubject.")
                    return None
                latitude = lat
                longitude = lon
            except Exception as geo_e:
                logger.error(f"Error during geocoding for chart ID {chart_db.id}, city {chart_db.city}: {geo_e}")
                return None
        
        try:
            # Kerykeion's AstrologicalSubject expects naive datetime for birth_dt
            # The Chart model stores naive UTC datetime.
            naive_birth_dt = chart_db.birth_datetime # Assuming it's already naive UTC as per previous CRUD logic

            subject = _AstrologicalSubject(
                name=chart_db.name,
                year=naive_birth_dt.year,
                month=naive_birth_dt.month,
                day=naive_birth_dt.day,
                hour=naive_birth_dt.hour,
                minute=naive_birth_dt.minute,
                city=chart_db.city,
                lat=latitude, # Use fetched or existing latitude
                lon=longitude # Use fetched or existing longitude
                # nation and sex are optional in Kerykeion
            )
            logger.info(f"Successfully created AstrologicalSubject for {chart_db.name} (ID: {chart_db.id})")
            return subject
        except _KerykeionException as ke:
            logger.error(f"KerykeionException creating AstrologicalSubject for {chart_db.name} (ID: {chart_db.id}): {ke}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error creating AstrologicalSubject for {chart_db.name} (ID: {chart_db.id}): {e}", exc_info=True)
            return None

# Remove direct instantiation
# crud_chart = CRUDChart() 

# Dependency function
async def get_crud_chart(db: AsyncSession = Depends(get_async_session)):
    # Yield or return? FastAPI handles both, but yield is common for session cleanup patterns.
    # For simple DI like this, return is fine.
    return CRUDChart(db=db) 