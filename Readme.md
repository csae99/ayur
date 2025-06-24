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
bash```

2. 📦 Install DevOps Tools
<details> <summary>Jenkins</summary>
bash
Copy
Edit
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
sudo apt update && sudo apt install -y jenkins
sudo systemctl enable jenkins && sudo systemctl start jenkins
Access Jenkins UI at http://<EC2-IP>:8080

</details> <details> <summary>SonarQube</summary>
Run SonarQube via Docker:

bash
Copy
Edit
docker run -d --name sonarqube -p 9000:9000 sonarqube
Access SonarQube at http://<EC2-IP>:9000

</details> <details> <summary>kind (Kubernetes)</summary>
bash
Copy
Edit
curl -Lo ./kind https://kind.sigs.k8s.io/dl/latest/kind-linux-amd64
chmod +x ./kind && sudo mv ./kind /usr/local/bin/
kind create cluster
</details> <details> <summary>ArgoCD</summary>
bash
Copy
Edit
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
Access ArgoCD UI via port-forward:

bash
Copy
Edit
kubectl port-forward svc/argocd-server -n argocd 8081:443
Then visit https://localhost:8081 (ignore SSL warning initially)

</details> <details> <summary>Trivy</summary>
bash
Copy
Edit
sudo apt install wget -y
wget https://github.com/aquasecurity/trivy/releases/latest/download/trivy_0.50.0_Linux-64bit.deb
sudo dpkg -i trivy_0.50.0_Linux-64bit.deb
</details>
3. 📈 Monitoring Setup with Prometheus & Grafana
Prometheus and Grafana are installed using Helm into the kind Kubernetes cluster.

Install Helm (if not installed)
bash
Copy
Edit
curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
Add Helm Repos and Update
bash
Copy
Edit
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
Deploy Prometheus
bash
Copy
Edit
kubectl create namespace monitoring
helm install prometheus prometheus-community/prometheus -n monitoring
Deploy Grafana
bash
Copy
Edit
helm install grafana grafana/grafana -n monitoring
Access Grafana
Find Grafana service port:

bash
Copy
Edit
kubectl get svc -n monitoring
Port-forward Grafana UI:

bash
Copy
Edit
kubectl port-forward svc/grafana 3000:80 -n monitoring
Open http://localhost:3000 in your browser.

Retrieve Grafana admin password:

bash
Copy
Edit
kubectl get secret --namespace monitoring grafana -o jsonpath="{.data.admin-password}" | base64 --decode
🔁 Pipeline Flow
Developer pushes code to GitHub

Jenkins triggers CI jobs:

Runs unit tests and builds Docker images

Runs Trivy scans on Docker images

Pushes images to Docker Hub or ECR

Updates manifests in Git repo for K8s deployment

ArgoCD watches manifests repo and deploys changes to Kubernetes (kind)

SonarQube runs static code analysis during Jenkins build

Prometheus scrapes metrics from Jenkins, Kubernetes, and nodes

Grafana visualizes these metrics on dashboards

📊 Monitoring & Ports
Service	Port
Jenkins	8080
SonarQube	9000
ArgoCD	8081 (via port-forward)
Grafana	3000 (via port-forward)
Prometheus	9090

🔐 Security Considerations
Use IAM roles or AWS Secrets Manager to handle credentials securely.

Avoid hardcoding secrets in Jenkinsfiles or manifests.

Restrict inbound ports on EC2 security groups.

Use HTTPS and authentication for Jenkins, ArgoCD, and Grafana.

Regularly update Trivy vulnerability definitions and scan images pre-deployment.

🧪 Testing
Push sample application to GitHub.

Trigger Jenkins build and verify:

SonarQube quality gate passes.

Trivy scan results.

Docker image is pushed to registry.

ArgoCD syncs and deploys to Kubernetes.

Metrics show up in Grafana dashboards.

📎 Notes
This setup is ideal for low-cost dev/test environments.

It leverages burstable AWS instance (t3a.large) and local Kubernetes (kind).

You can containerize all services or migrate to dedicated servers later for production.

Customize the Jenkinsfile and Helm charts according to your app’s needs.

📄 License
MIT License (or specify your preferred license)

🙋‍♂️ Contributors
Your Name

🖼 Architecture Diagram (Optional)
You can add a simple ASCII or image diagram:

markdown
Copy
Edit
GitHub → Jenkins → Docker + Trivy → ArgoCD → kind (K8s) → Prometheus & Grafana
                                         ↑
                                    SonarQube
