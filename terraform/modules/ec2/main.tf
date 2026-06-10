data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_caller_identity" "current" {}

# ── IAMロール ─────────────────────────────────────────────────
resource "aws_iam_role" "ec2" {
  name = "${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })
}

# SSM Session Manager必須ポリシー
resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# ECR pull + S3 + SSM Parameter Store読み取り
resource "aws_iam_policy" "ec2_app" {
  name        = "${var.project_name}-ec2-app-policy"
  description = "Allow EC2 to pull ECR images, access S3, and read SSM parameters"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECRAuth"
        Effect = "Allow"
        Action = ["ecr:GetAuthorizationToken"]
        Resource = ["*"]
      },
      {
        Sid    = "ECRPull"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = [
          "arn:aws:ecr:*:${data.aws_caller_identity.current.account_id}:repository/${var.project_name}-backend",
          "arn:aws:ecr:*:${data.aws_caller_identity.current.account_id}:repository/${var.project_name}-frontend"
        ]
      },
      {
        Sid    = "S3Access"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = ["arn:aws:s3:::${var.s3_bucket_name}/*"]
      },
      {
        Sid    = "SSMParameterRead"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:*:${data.aws_caller_identity.current.account_id}:parameter${var.ssm_parameter_path}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_app" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.ec2_app.arn
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# ── EC2インスタンス ───────────────────────────────────────────
resource "aws_instance" "main" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = "t3.small"
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.security_group_id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  user_data = templatefile("${path.module}/user_data.sh", {
    aws_region   = var.aws_region
    ecr_registry = var.ecr_registry
  })

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
  }

  tags = {
    Name        = "${var.project_name}-ec2"
    Environment = "production"
    Project     = var.project_name
  }
}
