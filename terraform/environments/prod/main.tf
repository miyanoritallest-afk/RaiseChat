terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket         = "raisechat-terraform-state-074610726755"
    key            = "prod/terraform.tfstate"
    region         = "ap-northeast-1"
    use_lockfile   = true
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

module "iam_oidc" {
  source       = "../../modules/iam_oidc"
  project_name = var.project_name
  aws_region   = var.aws_region
  github_repo  = var.github_repo
}

module "ecr" {
  source       = "../../modules/ecr"
  project_name = var.project_name
}

module "networking" {
  source       = "../../modules/networking"
  project_name = var.project_name
  aws_region   = var.aws_region
}

module "ssm_parameters" {
  source       = "../../modules/ssm_parameters"
  project_name = var.project_name
  aws_region   = var.aws_region
}

module "rds" {
  source            = "../../modules/rds"
  project_name      = var.project_name
  subnet_ids        = module.networking.private_subnet_ids
  security_group_id = module.networking.rds_sg_id
  db_password       = var.db_password
}

module "s3" {
  source       = "../../modules/s3"
  project_name = var.project_name
}

module "ec2" {
  source              = "../../modules/ec2"
  project_name        = var.project_name
  aws_region          = var.aws_region
  subnet_id           = module.networking.public_subnet_ids[0]
  security_group_id   = module.networking.ec2_sg_id
  ecr_registry        = module.ecr.registry_url
  s3_bucket_name      = module.s3.bucket_name
  ssm_parameter_path  = "/${var.project_name}/prod"
}

module "alb" {
  source            = "../../modules/alb"
  project_name      = var.project_name
  vpc_id            = module.networking.vpc_id
  public_subnet_ids = module.networking.public_subnet_ids
  security_group_id = module.networking.alb_sg_id
  ec2_instance_id   = module.ec2.instance_id
}
