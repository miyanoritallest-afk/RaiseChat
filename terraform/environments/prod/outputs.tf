output "alb_dns_name" {
  description = "ALB DNS name — set this as NEXT_PUBLIC_API_URL and FRONTEND_URL in SSM Parameter Store"
  value       = "http://${module.alb.dns_name}"
}

output "ec2_instance_id" {
  description = "EC2 instance ID — set this as EC2_INSTANCE_ID in GitHub Secrets"
  value       = module.ec2.instance_id
}

output "github_actions_role_arn" {
  description = "GitHub Actions IAM role ARN — set this as AWS_OIDC_ROLE_ARN in GitHub Secrets"
  value       = module.iam_oidc.role_arn
}

output "ecr_backend_url" {
  description = "ECR backend repository URL"
  value       = module.ecr.backend_repository_url
}

output "ecr_frontend_url" {
  description = "ECR frontend repository URL"
  value       = module.ecr.frontend_repository_url
}

output "rds_endpoint" {
  description = "RDS endpoint — use this to set DATABASE_URL in SSM Parameter Store"
  value       = module.rds.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket name for file uploads"
  value       = module.s3.bucket_name
}
