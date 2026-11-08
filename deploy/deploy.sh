#!/usr/bin/env bash
# Deploy Kiroween Invitation static site to captain / us-east-1 (S3 + CloudFront OAC).
# Safe to re-run. Requires AWS profile "captain". Prints the live URL.
#
# Cost note: S3 (a few KB) + CloudFront PriceClass_100. For a hackathon-scale
# demo this is within free tier / a few cents/month. There is no server, no
# Lambda, no database. Teardown with deploy/teardown.sh removes everything.
set -euo pipefail

PROFILE="${AWS_PROFILE:-captain}"
REGION="us-east-1"
STACK="ascii-invite"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "== 1/4 stage dist =="
node "$ROOT/deploy/stage.mjs"

# Optional custom domain. Example:
#   DOMAIN=kiroween-invitation.example.com ZONE_NAME=example.com bash deploy/deploy.sh
DOMAIN="${DOMAIN:-}"
ZONE_NAME="${ZONE_NAME:-}"
PARAMS=()
if [ -n "$DOMAIN" ]; then
  [ -n "$ZONE_NAME" ] || { echo "Set ZONE_NAME (the Route 53 zone that owns $DOMAIN)"; exit 1; }
  ZONE_ID="$(aws route53 list-hosted-zones-by-name --profile "$PROFILE" --dns-name "$ZONE_NAME" \
    --query "HostedZones[?Name=='${ZONE_NAME}.'].Id | [0]" --output text | sed 's#/hostedzone/##')"
  [ -n "$ZONE_ID" ] && [ "$ZONE_ID" != "None" ] || { echo "No hosted zone found for $ZONE_NAME"; exit 1; }
  PARAMS=(--parameter-overrides "DomainName=$DOMAIN" "HostedZoneId=$ZONE_ID")
fi

echo "== 2/4 deploy stack ($STACK) =="
aws cloudformation deploy \
  --profile "$PROFILE" --region "$REGION" \
  --stack-name "$STACK" \
  --template-file "$ROOT/deploy/template.yaml" \
  --no-fail-on-empty-changeset \
  --tags project=kiroween delete-after=2026-12-31 \
  ${PARAMS[@]+"${PARAMS[@]}"}

BUCKET="$(aws cloudformation describe-stacks --profile "$PROFILE" --region "$REGION" \
  --stack-name "$STACK" --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" --output text)"
DIST_ID="$(aws cloudformation describe-stacks --profile "$PROFILE" --region "$REGION" \
  --stack-name "$STACK" --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" --output text)"
URL="$(aws cloudformation describe-stacks --profile "$PROFILE" --region "$REGION" \
  --stack-name "$STACK" --query "Stacks[0].Outputs[?OutputKey=='SiteURL'].OutputValue" --output text)"

echo "== 3/4 sync files to s3://$BUCKET =="
aws s3 sync "$ROOT/dist" "s3://$BUCKET" --profile "$PROFILE" --region "$REGION" --delete \
  --cache-control "public,max-age=300"

echo "== 4/4 invalidate CloudFront =="
aws cloudfront create-invalidation --profile "$PROFILE" --region "$REGION" \
  --distribution-id "$DIST_ID" --paths "/*" >/dev/null

echo ""
echo "LIVE: $URL"
echo "(CloudFront may take a few minutes to finish deploying the first time.)"
