output "instance_id" {
  description = "EC2 instance ID — set this as EC2_INSTANCE_ID in GitHub Secrets"
  value       = aws_instance.main.id
}

output "public_ip" {
  description = "EC2 public IP address"
  value       = aws_instance.main.public_ip
}
