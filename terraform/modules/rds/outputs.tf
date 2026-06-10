output "endpoint" {
  description = "RDS endpoint (hostname:port) — use to build DATABASE_URL in SSM Parameter Store"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}
