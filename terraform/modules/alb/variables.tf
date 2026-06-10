variable "project_name" {
  description = "Project name used as prefix for resources"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for ALB (requires 2 AZs)"
  type        = list(string)
}

variable "security_group_id" {
  description = "ALB security group ID"
  type        = string
}

variable "ec2_instance_id" {
  description = "EC2 instance ID to register as ALB target"
  type        = string
}
