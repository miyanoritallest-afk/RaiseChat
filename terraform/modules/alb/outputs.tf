output "dns_name" {
  description = "ALB DNS name — use as NEXT_PUBLIC_API_URL and FRONTEND_URL in SSM Parameter Store"
  value       = aws_lb.main.dns_name
}

output "arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}
