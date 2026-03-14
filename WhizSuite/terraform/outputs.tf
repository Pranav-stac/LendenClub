output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.whizsuite_app.id
}

output "public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.whizsuite_app.public_ip
}

output "public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.whizsuite_app.public_dns
}

output "app_url" {
  description = "URL to access the WhizSuite application"
  value       = "http://${aws_instance.whizsuite_app.public_ip}:3000"
}

output "api_url" {
  description = "URL to access the WhizSuite API"
  value       = "http://${aws_instance.whizsuite_app.public_ip}:5000"
}
