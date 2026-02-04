# Ayurveda Platform - Helm Deployment Guide

## Prerequisites

1. **Kubernetes Cluster** (EKS, GKE, AKS, or local minikube/kind)
2. **kubectl** configured to connect to your cluster
3. **Helm 3.x** installed
4. **nginx-ingress controller** installed:
   ```bash
   helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
   helm install nginx-ingress ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace
   ```

## Chart Structure

```
helm-chart/
├── redis/              # Redis cache
├── libretranslate/     # Translation service
├── identity-service/   # Authentication
├── catalog-service/    # Medicine catalog
├── order-service/      # Orders & payments
├── notification-service/ # Email notifications
├── ayurbot-service/    # AI chatbot
├── frontend/           # Next.js app
├── ingress/            # ⭐ NEW: Nginx Ingress routing (recommended)
└── api-gateway/        # Legacy: Custom nginx gateway (for reference)
```

---

## Deployment Option 1: Using Ingress Chart (Recommended)

This approach uses nginx-ingress controller for routing - no api-gateway pod needed.

```bash
# 1. Create namespace
kubectl create namespace ayurveda

# 2. Deploy infrastructure
helm install ayur-redis ./redis -n ayurveda
helm install ayur-libretranslate ./libretranslate -n ayurveda

# 3. Deploy backend services (with secrets)
helm install ayur-identity ./identity-service -n ayurveda \
  --set database.password="YOUR_DB_PASSWORD" \
  --set jwtSecret="YOUR_JWT_SECRET" \
  --set s3.accessKey="YOUR_S3_ACCESS_KEY" \
  --set s3.secretKey="YOUR_S3_SECRET_KEY"

helm install ayur-catalog ./catalog-service -n ayurveda \
  --set database.password="YOUR_DB_PASSWORD" \
  --set jwtSecret="YOUR_JWT_SECRET" \
  --set s3.accessKey="YOUR_S3_ACCESS_KEY" \
  --set s3.secretKey="YOUR_S3_SECRET_KEY"

helm install ayur-order ./order-service -n ayurveda \
  --set database.password="YOUR_DB_PASSWORD" \
  --set jwtSecret="YOUR_JWT_SECRET" \
  --set razorpay.keyId="YOUR_RAZORPAY_KEY_ID" \
  --set razorpay.keySecret="YOUR_RAZORPAY_KEY_SECRET"

helm install ayur-notification ./notification-service -n ayurveda \
  --set smtp.user="YOUR_SMTP_USER" \
  --set smtp.pass="YOUR_SMTP_PASS"

helm install ayur-ayurbot ./ayurbot-service -n ayurveda \
  --set mongodb.uri="YOUR_MONGODB_URI" \
  --set gemini.apiKey="YOUR_GEMINI_API_KEY"

# 4. Deploy frontend
helm install ayur-frontend ./frontend -n ayurveda

# 5. Deploy Ingress (routes traffic to all services)
helm install ayur-ingress ./ingress -n ayurveda
```

### Ingress Routing (how it works)

| Path | Target Service | Rewritten To |
|------|----------------|--------------|
| `/` | frontend:3000 | `/` |
| `/api/identity/*` | identity-service:3001 | `/*` |
| `/api/catalog/*` | catalog-service:3002 | `/*` |
| `/api/orders/*` | order-service:3003 | `/*` |
| `/api/notifications/*` | notification-service:3004 | `/*` |
| `/api/bot/*` | ayurbot-service:8000 | `/*` |

---

## Deployment Option 2: Using API Gateway (Legacy)

Uses a custom nginx pod for routing (kept for reference).

```bash
# Same steps 1-4 as above, then:

# 5. Deploy API Gateway instead of Ingress
helm install ayur-gateway ./api-gateway -n ayurveda
```

---

## Verify Deployment

```bash
# Check all pods
kubectl get pods -n ayurveda

# Check services
kubectl get svc -n ayurveda

# Check ingress
kubectl get ingress -n ayurveda

# View logs
kubectl logs -f deployment/ayur-frontend -n ayurveda
```

## DNS Configuration

Point your domain to the Ingress controller's external IP:

```bash
kubectl get svc -n ingress-nginx
```

Add A records:
- `ayurved.xyz` → Ingress External IP
- `www.ayurved.xyz` → Ingress External IP

## TLS/SSL (Optional)

Update `ingress/values.yaml`:
```yaml
tls:
  enabled: true
  secretName: ayurved-tls
```

Then create certificate using cert-manager or manually.

## Cleanup

```bash
# Option 1 (with ingress)
helm uninstall ayur-ingress ayur-frontend ayur-ayurbot ayur-notification ayur-order ayur-catalog ayur-identity ayur-libretranslate ayur-redis -n ayurveda

# Option 2 (with api-gateway)
helm uninstall ayur-gateway ayur-frontend ayur-ayurbot ayur-notification ayur-order ayur-catalog ayur-identity ayur-libretranslate ayur-redis -n ayurveda

kubectl delete namespace ayurveda
```
