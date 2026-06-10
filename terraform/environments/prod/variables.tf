variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
  default     = "raisechat"
}

variable "github_repo" {
  description = "GitHub repository in format owner/repo"
  type        = string
}

variable "db_password" {
  description = "RDS master password — pass via TF_VAR_db_password environment variable (never commit to tfvars)"
  type        = string
  sensitive   = true
}
