#!/bin/bash
set -euo pipefail

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

log() { echo -e "${YELLOW}$1${NC}"; }
success() { echo -e "${GREEN}$1${NC}"; }
error() { echo -e "${RED}$1${NC}"; exit 1; }

load_env() {
  log "Loading .env..."
  if [ -f .env ]; then set -a && source .env && set +a; else error ".env not found"; fi
  for VAR in AWS_ACCOUNT_ID AWS_REGION APP_NAME; do
    [[ -z "${!VAR:-}" ]] && error "Missing $VAR in .env"
  done
  success "Env loaded"
}

bootstrap_cdk() {
  local BUCKET="cdk-hnb659fds-assets-$AWS_ACCOUNT_ID-$AWS_REGION"
  if aws cloudformation describe-stacks --stack-name CDKToolkit --region "$AWS_REGION" >/dev/null 2>&1 &&
     ! aws s3 ls "s3://$BUCKET" >/dev/null 2>&1; then
    log "Deleting broken CDKToolkit..."
    aws cloudformation delete-stack --stack-name CDKToolkit --region "$AWS_REGION"
    aws cloudformation wait stack-delete-complete --stack-name CDKToolkit --region "$AWS_REGION"
  fi
  cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION \
    --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \
    --trust $AWS_ACCOUNT_ID --bootstrap-bucket-name "$BUCKET" --require-approval never
}

deploy_prod() {
  load_env
  [[ ! -f cdk.json ]] && echo '{"app":"node cdk-app/dist/bin/cdk-app.js"}' > cdk.json

  command -v cdk >/dev/null || npm install -g aws-cdk

  log "Building CDK..."
  (cd cdk-app && npm install && npm run build)

  local BUCKET="cdk-hnb659fds-assets-$AWS_ACCOUNT_ID-$AWS_REGION"
  aws s3 ls "s3://$BUCKET" >/dev/null 2>&1 || bootstrap_cdk

  log "Deploying infra to ensure ECR exists..."
  cdk deploy ManuelDeploymentStackV2 --app "node cdk-app/dist/bin/cdk-app.js" --require-approval never

  ECR_URI=$(aws cloudformation describe-stacks \
    --stack-name ManuelDeploymentStackV2 --region $AWS_REGION \
    --query "Stacks[0].Outputs[?OutputKey=='ECRRepoUri'].OutputValue" --output text)
  [[ -z "$ECR_URI" || "$ECR_URI" == "None" ]] && error "No ECR URI found"
  success "ECR: $ECR_URI"

  log "Logging in to ECR..."
  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

  log "Building image for ECR..."
  docker build -t "${ECR_URI}:latest" .

  log "Pushing image to ECR..."
  docker push "${ECR_URI}:latest" || error "❌ Failed to push image to ECR"

  log "Forcing ECS service update..."
  aws ecs update-service --cluster EcsCluster --service NextAppService --force-new-deployment --region $AWS_REGION

  LB_DNS=$(aws cloudformation describe-stacks \
    --stack-name ManuelDeploymentStackV2 --region $AWS_REGION \
    --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerURL'].OutputValue" --output text)
  [[ -n "$LB_DNS" ]] && success "App: https://$LB_DNS" || log "LB URL not found"

  DB_URL=$(aws secretsmanager get-secret-value \
    --secret-id DatabaseUrlSecret --region $AWS_REGION \
    --query 'SecretString' --output text 2>/dev/null || true)
  [[ -n "$DB_URL" ]] && success "DB: $DB_URL"
}

[[ "${1:-}" == "--prod" ]] && deploy_prod || log "Run with --prod to deploy"
