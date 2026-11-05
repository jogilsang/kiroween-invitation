#!/usr/bin/env bash
# Remove the ASCII Invite site: empty the bucket, then delete the stack.
set -euo pipefail
PROFILE="${AWS_PROFILE:-captain}"
REGION="us-east-1"
STACK="ascii-invite"

BUCKET="$(aws cloudformation describe-stacks --profile "$PROFILE" --region "$REGION" \
  --stack-name "$STACK" --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" --output text 2>/dev/null || true)"

if [ -n "${BUCKET:-}" ] && [ "$BUCKET" != "None" ]; then
  echo "emptying s3://$BUCKET"
  aws s3 rm "s3://$BUCKET" --recursive --profile "$PROFILE" --region "$REGION" || true
fi

echo "deleting stack $STACK"
aws cloudformation delete-stack --profile "$PROFILE" --region "$REGION" --stack-name "$STACK"
aws cloudformation wait stack-delete-complete --profile "$PROFILE" --region "$REGION" --stack-name "$STACK" || true
echo "done"
