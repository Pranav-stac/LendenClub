# ===========================================================
# SECURITY GROUP – WhizSuite Application
#
#   INTENTIONAL VULNERABILITY (assignment requirement):
#     SSH port 22 is open to the entire internet (0.0.0.0/0).
#     This will be flagged by Trivy as a HIGH/CRITICAL finding.
#     It will be remediated after the first Jenkins pipeline run
#     using AI-assisted analysis.
# ===========================================================

resource "aws_security_group" "whizsuite_sg" {
  name        = "${var.app_name}-sg"
  description = "Security group for WhizSuite application server"

  # -------------------------------------------------------
  # VULNERABILITY: SSH open to the world
  # Trivy check: AVD-AWS-0107 / aws-ec2-no-public-ingress-sgr
  # -------------------------------------------------------
  ingress {
    description = "SSH – INSECURE: open to all IPs (to be remediated)"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # VULNERABILITY – must restrict to known IP
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

  # Allow all outbound traffic
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-sg"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}
