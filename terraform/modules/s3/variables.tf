variable "project_name" {
  description = "Project name used as prefix for resources"
  type        = string
}

variable "frontend_url" {
  description = "Frontend URL for CORS allowed origins (ALB DNS name, update after ALB creation)"
  type        = string
  default     = "http://PLACEHOLDER"
}
