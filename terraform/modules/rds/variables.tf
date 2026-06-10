variable "project_name" {
  description = "Project name used as prefix for resources"
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs for the DB subnet group (requires 2 AZs)"
  type        = list(string)
}

variable "security_group_id" {
  description = "RDS security group ID"
  type        = string
}

variable "db_password" {
  description = "RDS master password (set via TF_VAR_db_password environment variable)"
  type        = string
  sensitive   = true
  default     = null
}
