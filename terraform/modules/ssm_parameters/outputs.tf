output "parameter_path_prefix" {
  description = "SSM Parameter Store path prefix for all app parameters"
  value       = "/${var.project_name}/prod"
}
