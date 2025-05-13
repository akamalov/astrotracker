from sqlalchemy.orm import declarative_base

Base = declarative_base()

# DO NOT Import models here if they import Base themselves,
# as it creates circular dependencies. Models should be imported
# in alembic/env.py or when Base.metadata.create_all is called.
# from app.models.user import User
# from app.models.chart import Chart # Assuming Chart also exists/imports Base

# You can add shared columns or utility methods to this Base if needed later 