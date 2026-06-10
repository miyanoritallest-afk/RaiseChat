variable "project_name" {
  description = "Project name used as prefix for resources"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "subnet_id" {
  description = "Public subnet ID where the EC2 instance will be placed"
  type        = string
}

variable "security_group_id" {
  description = "EC2 security group ID"
  type        = string
}

variable "ecr_registry" {
  description = "ECR registry URL (account_id.dkr.ecr.region.amazonaws.com)"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name for file uploads (used in IAM policy)"
  type        = string
}

variable "ssm_parameter_path" {
  description = "SSM Parameter Store path prefix (e.g. /raisechat/prod)"
  type        = string
}
