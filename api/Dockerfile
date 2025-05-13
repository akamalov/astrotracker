# Use an official Python runtime as a parent image
FROM python:3.11 as builder

# Declare build arguments that can be passed from docker-compose
# ARG DATABASE_URL
# ARG POSTGRES_SERVER
# ARG POSTGRES_PORT
# ARG POSTGRES_USER
# ARG POSTGRES_PASSWORD
# ARG POSTGRES_DB
ARG SECRET_KEY

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
# Set ephemeris path
ENV SE_EPHE_PATH=/ephe_data

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libc-dev \
    make \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create directory for ephemeris files
RUN mkdir -p /ephe_data

# Copy ephemeris files from local context into the image
COPY ephe_data/* /ephe_data/

# Verify that sepl_18.se1 is not HTML
RUN head -c 10 /ephe_data/sepl_18.se1 | grep -qvE "<html|<HTML" || (echo "Error: sepl_18.se1 appears to be an HTML file." && exit 1)

# Install Poetry
RUN pip install --upgrade pip
RUN pip install poetry==1.8.3 # Pinning poetry version for consistency

# Copy only necessary files for dependency installation
COPY pyproject.toml poetry.lock* /app/

# Configure Poetry to create the virtualenv in the project directory
RUN poetry config virtualenvs.in-project true

# Update the lock file based on pyproject.toml before installing
RUN poetry lock --no-update

# Install dependencies
# --no-root: Don't install the project itself (we copy source later)
# --no-dev: Don't install development dependencies
# --no-interaction: Do not ask any interactive question
# --no-ansi: Do not output ANSI sequences
RUN poetry install --no-root --no-dev --no-interaction --no-ansi -vvv

# Verify Kerykeion installation in the builder stage
RUN poetry run python -c "import swisseph as swe; swe.set_ephe_path('${SE_EPHE_PATH}'); import kerykeion; print('Kerykeion and swisseph (with ephe path) imported successfully in builder!')"

# Create a new stage for the final image from the full Python base
# Using slim for smaller final image
FROM python:3.11-slim as final

# Also declare ARG(s) needed in this stage
# ARG DATABASE_URL
# ARG POSTGRES_SERVER
# ARG POSTGRES_PORT
# ARG POSTGRES_USER
# ARG POSTGRES_PASSWORD
# ARG POSTGRES_DB
ARG SECRET_KEY

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
# Ensure ephemeris path is set in final stage
ENV SE_EPHE_PATH=/ephe_data

WORKDIR /app

# Copy installed dependencies from the builder stage's virtual environment
COPY --from=builder /app/.venv/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
# Copy ephemeris data from builder
COPY --from=builder ${SE_EPHE_PATH} ${SE_EPHE_PATH}

# Copy the application code
COPY ./app /app/app
COPY ./migrations /app/migrations
COPY ./alembic.ini /app/alembic.ini

# Expose the port the app runs on
EXPOSE 8000

# Define the command to run the application
# Use 0.0.0.0 to ensure it's accessible from outside the container
# Use reload for development hot-reloading (consider removing --reload for production)
# Add proxy headers support
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips='*'", "--reload"]

# TEMPORARY CMD FOR DEBUGGING KERYKEION INSTALLATION
# CMD ["sh", "-c", "ls -l /ephe_data && sleep 30 && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"]

# Install Poetry in the final image for dev/test workflows
RUN pip install --upgrade pip && pip install poetry==1.8.3
ENV PATH="/root/.local/bin:$PATH"
# Copy pyproject.toml and poetry.lock for Poetry install in final stage
COPY pyproject.toml poetry.lock* /app/
RUN poetry install --no-root --no-interaction --no-ansi -vvv
