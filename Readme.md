# DevOps CI/CD Pipeline with Jenkins, SonarQube, Docker, Kubernetes, ArgoCD, Trivy, Prometheus & Grafana

## 📌 Project Overview

This project demonstrates a complete DevOps CI/CD pipeline and monitoring setup using:
- **Jenkins**: Continuous integration and job orchestration
- **SonarQube**: Static code analysis
- **Docker**: Containerization
- **Kubernetes (kind)**: Local Kubernetes cluster for deployment
- **ArgoCD**: GitOps-based continuous deployment
- **Trivy**: Container vulnerability scanning
- **Prometheus & Grafana**: Monitoring and visualization

All tools are deployed on a single AWS EC2 instance (`t3a.large`) to optimize for cost and simplicity.

---

## 🔧 Tech Stack

| Tool         | Purpose                               |
|--------------|-------------------------------------|
| Jenkins      | CI / build orchestration             |
| SonarQube    | Code quality analysis                |
| Docker       | Containerization                    |
| Kubernetes   | Container orchestration via kind    |
| ArgoCD       | GitOps continuous deployment        |
| Trivy        | Image vulnerability scanning         |
| Prometheus   | Metrics collection                   |
| Grafana      | Monitoring dashboards                |
| Helm         | Kubernetes package manager           |
| AWS EC2      | Hosting environment                  |

---

## 🚀 Setup Instructions

### 1. 🖥️ EC2 Instance Setup

Launch an EC2 instance with the following spec:
- Type: `t3a.large`
- OS: Ubuntu 22.04 LTS
- Storage: 50 GB (EBS gp3 or gp2)
- Security group: Open ports 22 (SSH), 8080 (Jenkins), 9000 (SonarQube), 3000–3200 (ArgoCD, Grafana UI), 80/443 (optional)

Update and install base tools:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io openjdk-11-jdk git unzip curl
sudo systemctl enable docker && sudo systemctl start docker
