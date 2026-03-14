terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # S3 backend – state persists across Jenkins runs (avoids "security group already exists")
  # Create bucket once: aws s3 mb s3://BUCKET --region ap-south-1
  # Pass bucket via: terraform init -backend-config="bucket=BUCKET"
  backend "s3" {
    key    = "whizsuite/terraform.tfstate"
    region = "ap-south-1"
    # bucket set via -backend-config in Jenkins (TF_STATE_BUCKET param)
  }
}

provider "aws" {
  region = var.aws_region
}
