# DockerHub Deployment Guide

## Images Published to DockerHub

All service images have been successfully pushed to DockerHub under the username **shubham554**:

| Service | Image Name | Tag |
|---------|-----------|-----|
| API Gateway | `shubham554/ayur-api-gateway` | `latest` |
| Frontend | `shubham554/ayur-frontend` | `latest` |
| Identity Service | `shubham554/ayur-identity-service` | `latest` |
| Catalog Service | `shubham554/ayur-catalog-service` | `latest` |
| Order Service | `shubham554/ayur-order-service` | `latest` |
| Notification Service | `shubham554/ayur-notification-service` | `latest` |
| AyurBot Service | `shubham554/ayur-ayurbot-service` | `latest` |

## Deployment Options

### Option 1: Development Deployment (with build capability)
Use `docker-compose.yml` when you want to:
- Build images locally
- Make code changes and rebuild
- Development environment

```bash
docker compose up -d --build
```

### Option 2: Production Deployment (pull from DockerHub)
Use `docker-compose.prod.yml` when you want to:
- Deploy without building (faster)
- Use pre-built images from DockerHub
- Production environment

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Deploying to a New Server

### Prerequisites
- Docker and Docker Compose installed
- Internet connection to pull images from DockerHub

### Steps

1. **Copy required files to the new server**:
   ```
   microservices/
   ├── docker-compose.prod.yml
   ├── backups/
   │   ├── postgres_backup_20251130_233427_utf8.sql
   │   └── (MongoDB backup if available)
   ├── identity-service/migrations/init.sql
   ├── catalog-service/migrations/init.sql
   └── order-service/migrations/init.sql
   ```

2. **Navigate to the directory**:
   ```bash
   cd microservices
   ```

3. **Pull and start all services**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

4. **Verify all services are running**:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```

## Updating Images

When you make changes and want to update the images on DockerHub:

1. **Rebuild the images**:
   ```bash
   docker compose build
   ```

2. **Push to DockerHub**:
   ```bash
   docker compose push
   ```

3. **On deployment servers, pull the latest images**:
   ```bash
   docker compose -f docker-compose.prod.yml pull
   docker compose -f docker-compose.prod.yml up -d
   ```

## Environment Variables

Remember to update sensitive environment variables before deploying to production:
- `JWT_SECRET` - Change from default
- `GEMINI_API_KEY` - Ensure it's valid
- Database credentials (`DB_USER`, `DB_PASSWORD`)

## Database Considerations

### PostgreSQL
- ✅ Backup is UTF-8 encoded and will auto-restore on first startup
- Contains: users, catalog items, orders, coupons, appointments, prescriptions

### MongoDB
- ⚠️ Currently no valid backup (create new backup if needed)
- Used by: AyurBot service for conversation history

## Accessing the Application

Once deployed:
- **Main Application**: http://server-ip:80 (via API Gateway)
- **Frontend Direct**: http://server-ip:3000
- **AyurBot Service**: http://server-ip:8000
- **Notification Service**: http://server-ip:3004

## Troubleshooting

### Pull Rate Limits
If you hit DockerHub rate limits:
```bash
docker login
# Enter your DockerHub credentials
```

### Checking Service Logs
```bash
docker compose -f docker-compose.prod.yml logs [service-name]
```

### Restarting a Service
```bash
docker compose -f docker-compose.prod.yml restart [service-name]
```
