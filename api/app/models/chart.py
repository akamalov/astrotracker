# /app/models/chart.py
from sqlalchemy import Column, String, DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as SQLAlchemyUUID
from sqlalchemy.orm import relationship
from uuid import uuid4
from datetime import datetime
from typing import Optional
from uuid import UUID # Need UUID type hint

# Import the Base from the correct location
from app.db.base import Base

class Chart(Base):
    """SQLAlchemy model representing the 'chart' table."""
    __tablename__ = "chart"

    id: UUID = Column(SQLAlchemyUUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    name: str = Column(String, index=True, nullable=False)
    birth_datetime: datetime = Column(DateTime, index=True, nullable=False)
    city: str = Column(String, index=True, nullable=False)
    location_name: Optional[str] = Column(String, index=True, nullable=True)
    latitude: Optional[float] = Column(Float, nullable=True)
    longitude: Optional[float] = Column(Float, nullable=True)
    user_id: UUID = Column(SQLAlchemyUUID(as_uuid=True), ForeignKey("user.id"), index=True, nullable=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Define relationships (uncomment if User model defines back_populates)
    # user = relationship(\"User\", back_populates=\"charts\") 