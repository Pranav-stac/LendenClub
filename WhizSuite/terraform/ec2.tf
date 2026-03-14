# ===========================================================
# EC2 Instance – WhizSuite Application Server
# Runs all containers via Docker Compose on startup
# ===========================================================

resource "aws_instance" "whizsuite_app" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.whizsuite_sg.id]

  # IMDS v2 required (Trivy AWS-0028)
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit  = 1
  }

  # Root EBS volume – encrypted (Trivy AWS-0131)
  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
    encrypted             = true
  }

  # User-data: bootstrap Docker and launch WhizSuite
  user_data = templatefile("${path.module}/user_data.sh", {
    github_repo_url = var.github_repo_url
    database_url    = var.database_url
    jwt_secret      = var.jwt_secret
    use_local_db    = tostring(var.use_local_db)
    frontend_url    = "http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
    app_name        = var.app_name
  })

  tags = {
    Name        = "${var.app_name}-server"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}
