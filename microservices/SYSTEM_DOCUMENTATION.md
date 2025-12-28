# Ayurveda Platform - System Documentation

## 1. Project Overview
The **Ayurveda Platform** is a microservices-based e-commerce and wellness application designed to provide Ayurvedic medicines, practitioner consultations, and AI-driven health recommendations. It creates a seamless ecosystem for Patients, Practitioners, and Admins.

## 2. System Architecture
The project follows a **Microservices Architecture** where each distinct business capability is encapsulated in its own service. Services communicate via HTTP REST APIs (synchronous), with an API Gateway acting as the single entry point.

### Architecture Diagram
```mermaid
graph TD
    Client[Web Client / Mobile] --> Gateway[API Gateway (Nginx)]
    
    Gateway --> |/auth, /admin, /practitioners| Identity[Identity Service]
    Gateway --> |/items, /categories| Catalog[Catalog Service]
    Gateway --> |/orders, /cart, /checkout| Order[Order Service]
    Gateway --> |/chat, /dosha| AyurBot[AyurBot Service AI]
    
    Order --> |Trigger Email| Notification[Notification Service]
    Order --> |Get User Info| Identity
    Order --> |Get Item Info| Catalog
    
    Identity --> PG[(PostgreSQL)]
    Catalog --> PG
    Catalog --> Redis[(Redis Cache)]
    Order --> PG
    AyurBot --> Mongo[(MongoDB)]
    AyurBot --> Gemini[Gemini AI API]
    Notification --> SMTP[Gmail SMTP]
```

## 3. Microservices Breakdown

### 1. Frontend (`frontend`)
- **Type**: Web Application (PWA)
- **Tech**: Next.js 14, TypeScript, Tailwind CSS
- **Port**: `3000`
- **Responsibility**: Provides the UI for Patients, Admins, and Practitioners. Features a responsive dashboard, medicine catalog, cart, and chat interface.

### 2. API Gateway (`api-gateway`)
- **Type**: Reverse Proxy
- **Tech**: Nginx
- **Port**: `80` (Internal), mapped to host.
- **Responsibility**: 
  - Routes incoming requests to appropriate microservices.
  - Handles CORS (Cross-Origin Resource Sharing) centrally.
  - SSL termination (prod).

### 3. Identity Service (`identity-service`)
- **Type**: Backend Service
- **Tech**: Node.js, Express, Sequelize (ORM)
- **Database**: PostgreSQL (`ayur_db`)
- **Port**: `3001`
- **Responsibility**: User authentication (JWT), user profile management, admin and practitioner management.

### 4. Catalog Service (`catalog-service`)
- **Type**: Backend Service
- **Tech**: Node.js, Express, Sequelize
- **Database**: PostgreSQL (`ayur_db`), Redis (Caching)
- **Port**: `3002`
- **Responsibility**: Manages medicines, herbs, categories, and translation of product details (using LibreTranslate).

### 5. Order Service (`order-service`)
- **Type**: Backend Service
- **Tech**: Node.js, Express, Sequelize
- **Database**: PostgreSQL (`ayur_db`)
- **Port**: `3003`
- **Responsibility**: Manages Shopping Cart, Wishlist, Order placement, Payments (Razorpay), and Inventory tracking.

### 6. Notification Service (`notification-service`)
- **Type**: Utility Service
- **Tech**: Node.js, Express, Nodemailer
- **Port**: `3004`
- **Responsibility**: Sends transactional emails (Order Confirmation, Status Updates) and SMS.

### 7. AyurBot Service (`ayurbot-service`)
- **Type**: AI Service
- **Tech**: Python, FastAPI, Motor (Async Mongo Driver)
- **Database**: MongoDB (Chat History)
- **AI Model**: Google Gemini 2.5 Flash
- **Port**: `8000`
- **Responsibility**: Provides AI chat assistance, Dosha assessment, and herb recommendations.

## 4. Technology Stack

| Component | Technology | Version / Details |
|-----------|------------|-------------------|
| **Frontend** | Next.js | v14.x (App Router) |
| **Styling** | Tailwind CSS | v3.x |
| **Backend (Core)** | Node.js | v18+ |
| **Backend (AI)** | Python | v3.9+ (FastAPI) |
| **Database (Relational)** | PostgreSQL | v15 |
| **Database (NoSQL)** | MongoDB | v6.x |
| **Caching** | Redis | v7.x |
| **AI/LLM** | Google Gemini | Pro/Flash Model |
| **Containerization** | Docker | Docker Compose |

## 5. Key Workflows

### Order Placement Flow
1. **User** logs in on Frontend.
2. **Frontend** calls `Catalog Service` to display medicines.
3. User adds items to cart -> **Order Service** updates Cart table.
4. User clicks Checkout -> **Order Service** creates Order records in Postgres.
5. **Order Service** immediately calls `Notification Service` API.
6. **Notification Service** connects to SMTP (Gmail) and sends confirmation email.

### AI Chat Flow
1. User asks "What is good for stress?" on Frontend.
2. Request sent to `AyurBot Service`.
3. **AyurBot** retrieves conversation history from MongoDB.
4. **AyurBot** constructs prompt and calls **Gemini API**.
5. Response is saved to MongoDB and returned to user.

## 6. Infrastructure & Deployment
The entire stack is containerized.
- **Dev Mode**: `docker-compose.yml` (Hot-reloading for Node services)
- **Prod Mode**: `docker-compose.prod.yml` (Optimized images, restart policies)

### Data Persistence
- **Postgres Data**: Stored in named volume `postgres_data`
- **Mongo Data**: Stored in named volume `mongo_data`
- **Redis Data**: Stored in named volume `redis_data`

## 7. Future Enhancements
- **Kafka Integration**: To decouple Order and Notification services.
- **Twilio SMS**: To enable real SMS notifications.
