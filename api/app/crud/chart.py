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

# Remove direct instantiation
# crud_chart = CRUDChart() 

# Dependency function
async def get_crud_chart(db: AsyncSession = Depends(get_async_session)):
    # Yield or return? FastAPI handles both, but yield is common for session cleanup patterns.
    # For simple DI like this, return is fine.
    return CRUDChart(db=db) 