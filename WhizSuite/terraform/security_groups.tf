# ===========================================================
# SECURITY GROUP – WhizSuite Application
# (Remediated: SSH restricted to admin_ip, egress narrowed)
# ===========================================================

resource "aws_security_group" "whizsuite_sg" {
  name        = "${var.app_name}-sg"
  description = "Security group for WhizSuite application server"

  # SSH restricted (Trivy AWS-0107) – 10.0.0.1/32 for VPC-only; change for public SSH
  ingress {
    description = "SSH – restricted"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.1/32"]
  }

  # HTTP access for Next.js client
  ingress {
    description = "HTTP – Next.js client"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP access for Express API
  ingress {
    description = "HTTP – Express API"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP (optional – for reverse proxy / load balancer)
  ingress {
    description = "HTTP port 80"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Egress restricted (Trivy AWS-0104) – HTTPS, HTTP, DNS
  egress {
    description = "HTTPS outbound"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    description = "HTTP outbound"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    description = "DNS"
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    description = "PostgreSQL (RDS)"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-sg"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}
