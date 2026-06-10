variable "project_name" {
  description = "Project name used as prefix for resources"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository in format owner/repo (e.g. miyanoritallest-afk/RaiseChat)"
  type        = string
}
