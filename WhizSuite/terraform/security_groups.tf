# ===========================================================
# VULNERABLE VERSION – For Assignment Demonstration Only
# DO NOT USE IN PRODUCTION
#
# This file shows the INITIAL state before AI remediation.
# Trivy will report: AVD-AWS-0107 (HIGH) – SSH open to 0.0.0.0/0
#
# To demo the full flow:
#   1. cp security_groups.vulnerable.example security_groups.tf
#   2. Push and run Jenkins pipeline – Stage 3 fails
#   3. AI Remediation (Stage 4) fixes it
#   4. Re-scan passes; pipeline succeeds
# ===========================================================

resource "aws_security_group" "whizsuite_sg" {
  name        = "${var.app_name}-sg"
  description = "Security group for WhizSuite application server"

  # INTENTIONAL VULNERABILITY: SSH open to entire internet (0.0.0.0/0)
  # Trivy AVD-AWS-0107 – aws-ec2-no-public-ingress-sgr (HIGH)
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP Next.js client"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP Express API"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP port 80"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
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
