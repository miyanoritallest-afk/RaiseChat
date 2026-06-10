output "bucket_name" {
  description = "S3 bucket name for file uploads"
  value       = aws_s3_bucket.uploads.bucket
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.uploads.arn
}
