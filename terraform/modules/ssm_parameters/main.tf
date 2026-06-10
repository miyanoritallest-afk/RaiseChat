# プレースホルダー値を作成する。実際の値はapply後にAWS CLIまたはコンソールで手動設定すること。
# aws ssm put-parameter --name "/raisechat/prod/JWT_SECRET" --value "実際の値" --type SecureString --overwrite

resource "aws_ssm_parameter" "database_url" {
  name        = "/${var.project_name}/prod/DATABASE_URL"
  description = "PostgreSQL connection string (update after RDS creation)"
  type        = "SecureString"
  value       = "PLACEHOLDER_UPDATE_AFTER_RDS_CREATION"

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "jwt_secret" {
  name        = "/${var.project_name}/prod/JWT_SECRET"
  description = "JWT signing secret"
  type        = "SecureString"
  value       = "PLACEHOLDER_SET_SECURE_VALUE"

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "sentry_dsn" {
  name        = "/${var.project_name}/prod/SENTRY_DSN"
  description = "Sentry DSN for error tracking"
  type        = "SecureString"
  value       = "PLACEHOLDER_SET_SENTRY_DSN"

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "next_public_api_url" {
  name        = "/${var.project_name}/prod/NEXT_PUBLIC_API_URL"
  description = "ALB DNS name (update after ALB creation)"
  type        = "String"
  value       = "PLACEHOLDER_UPDATE_AFTER_ALB_CREATION"

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "frontend_url" {
  name        = "/${var.project_name}/prod/FRONTEND_URL"
  description = "Frontend URL for CORS (same as NEXT_PUBLIC_API_URL, update after ALB creation)"
  type        = "String"
  value       = "PLACEHOLDER_UPDATE_AFTER_ALB_CREATION"

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "aws_s3_bucket_name" {
  name        = "/${var.project_name}/prod/AWS_S3_BUCKET_NAME"
  description = "S3 bucket name for file uploads (update after S3 creation)"
  type        = "String"
  value       = "PLACEHOLDER_UPDATE_AFTER_S3_CREATION"

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "aws_region" {
  name        = "/${var.project_name}/prod/AWS_REGION"
  description = "AWS region"
  type        = "String"
  value       = var.aws_region
}
