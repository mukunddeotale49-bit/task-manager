# CloudTask Manager — Docker on AWS EC2 + RDS MySQL

Full-stack **Task Manager** web application (React + Vite + Nginx frontend, Node.js + Express backend) hosted in Docker containers on a single **AWS EC2** instance and connected to **Amazon RDS for MySQL**.

---

## Folder Structure

```text
ec2-rds-task-manager/
├── .env.example
├── .gitignore
├── docker-compose.yml        # Local development (includes MySQL container)
├── docker-compose.prod.yml   # AWS EC2 production (connects to RDS MySQL)
├── README.md
├── backend/
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── config/
│       │   └── db.js
│       ├── middleware/
│       │   └── validateTask.js
│       ├── routes/
│       │   └── tasks.js
│       └── server.js
├── db/
│   └── init.sql
└── frontend/
    ├── .dockerignore
    ├── Dockerfile
    ├── index.html
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── api.js
        ├── App.jsx
        ├── main.jsx
        └── styles.css
```

---

## Option A: Run Locally (with Docker MySQL)

```bash
cp .env.example .env
docker compose up --build -d
```
- Frontend: `http://localhost:8080`
- Backend Health: `http://localhost:5000/health`

---

## Option B: Deploy on AWS EC2 + RDS MySQL

### Step 1: Launch EC2 Instance
1. Go to **AWS Console -> EC2 -> Launch Instance**:
   - **AMI:** Ubuntu Server 24.04 LTS (`t3.micro` or `t2.micro`)
   - **Security Group (`ec2-web-sg`):**
     - Inbound **SSH (22)** from **My IP**
     - Inbound **HTTP (80)** from **Anywhere (`0.0.0.0/0`)**

### Step 2: Create RDS MySQL Instance
1. Go to **AWS Console -> RDS -> Create database**:
   - **Engine:** MySQL 8.0 (Free tier / Dev-Test)
   - **DB instance identifier:** `taskmanager-db`
   - **Master username:** `admin`
   - **Master password:** Set a strong password
   - **VPC:** Same VPC as your EC2 instance
   - **Public access:** `No`
   - **VPC security group:** Create new (`rds-mysql-sg`)
   - **Initial database name:** `taskmanager`
2. Once status is **Available**, copy the **RDS Endpoint** (e.g. `taskmanager-db.xxxx.us-east-1.rds.amazonaws.com`).

### Step 3: Allow EC2 -> RDS Traffic
1. Open **EC2 -> Security Groups -> `rds-mysql-sg` -> Edit inbound rules**.
2. Add rule: **Type = MYSQL/Aurora (3306)**, **Source = `ec2-web-sg`**.

### Step 4: Install Docker on EC2 & Copy Project
```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2 unzip
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker
```
Upload and extract the ZIP on EC2:
```bash
unzip ec2-rds-task-manager.zip
cd ec2-rds-task-manager
```

### Step 5: Configure RDS Endpoint in `.env`
```bash
cat <<EOF > .env
NODE_ENV=production
BACKEND_PORT=5000
FRONTEND_PORT=80
DB_HOST=<YOUR_RDS_ENDPOINT>
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=<YOUR_RDS_PASSWORD>
DB_NAME=taskmanager
DB_SSL=true
CORS_ORIGIN=http://<YOUR_EC2_PUBLIC_IP>
EOF
```

### Step 6: Start Frontend & Backend Containers
```bash
docker compose -f docker-compose.prod.yml up --build -d
docker logs taskmanager-backend
```
Visit `http://<YOUR_EC2_PUBLIC_IP>` in your browser.
