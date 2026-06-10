output "terraform_state_bucket" {
  description = "S3 bucket name for Terraform state"
  value       = aws_s3_bucket.terraform_state.bucket
}

output "terraform_locks_table" {
  description = "DynamoDB table name for Terraform state locks"
  value       = aws_dynamodb_table.terraform_locks.name
}

output "account_id" {
  description = "AWS account ID"
  value       = local.account_id
}
