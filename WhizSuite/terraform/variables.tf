variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-south-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "ami_id" {
  description = "Amazon Linux 2 AMI ID for ap-south-1"
  type        = string
  # Amazon Linux 2 AMI (HVM) in ap-south-1 – update as needed
  default = "ami-0f58b397bc5c1f2e8"
}

variable "key_name" {
  description = "Name of existing EC2 key pair for SSH access"
  type        = string
  default     = "whizsuite-key"
}

variable "app_name" {
  description = "Application name used for tagging"
  type        = string
  default     = "whizsuite"
}

variable "github_repo_url" {
  description = "HTTPS URL of the GitHub repository to clone on the EC2 instance"
  type        = string
  default     = "https://github.com/your-username/whizsuite.git"
}

variable "database_url" {
  description = "PostgreSQL DATABASE_URL (AWS RDS connection string)"
  type        = string
  sensitive   = true
  default     = "postgresql://pranav:12345678@whizsuite.c36o8guuiarw.ap-south-1.rds.amazonaws.com:5432/postgres?schema=public"
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
  default     = "whizsuite_jwt_secret_2026"
}

variable "frontend_url" {
  description = "Frontend URL for CORS configuration"
  type        = string
  default     = "http://localhost:3000"
}

variable "admin_ip" {
  description = "Your public IP for SSH access in CIDR form (e.g. 1.2.3.4/32). Get from https://whatismyip.com"
  type        = string
  default     = "10.0.0.1/32"  # VPC-only; set your IP for SSH from internet
}
