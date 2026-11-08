# Deploy — Kiroween Invitation

Static site, no server. Private S3 bucket served only through CloudFront with
Origin Access Control (OAC). Nothing is publicly readable on S3 directly.

## What gets created (captain / us-east-1)

- One S3 bucket (private, encrypted, public access blocked).
- One CloudFront distribution (PriceClass_100, HTTPS redirect, OAC to the bucket).
- A bucket policy allowing only that distribution to read.
- Tags on bucket + distribution: `project=kiroween`, `delete-after=2026-12-31`.

## Cost

A hackathon-scale static site: a few KB in S3 plus CloudFront PriceClass_100.
Expected cost is within free tier / a few cents per month. No Lambda, no
database, no server. `deploy/teardown.sh` removes everything.

## Run

```bash
# Re-authenticate captain first if the session expired (aws login).
AWS_PROFILE=captain bash deploy/deploy.sh      # prints the live https URL
AWS_PROFILE=captain bash deploy/teardown.sh    # remove all resources
```

`deploy/stage.mjs` builds a flat `dist/` (index.html at root, engine/ and assets/
alongside, `../` paths rewritten to `./`). `deploy.sh` deploys the stack, syncs
`dist/`, and invalidates the cache.

## Status (2026-11-05)

- Template structurally validated offline, then validated live against captain
  (no IAM capabilities needed).
- `stage.mjs` verified: produces a correct flat `dist/` with rewritten paths.
- **DEPLOYED and live:** https://kiroween-invitation.chogilsang.net
  - Stack `ascii-invite` created in captain / us-east-1.
  - Bucket is private; served only via CloudFront OAC.
  - Verified in a real browser: HTTP 200, no console errors, invitation renders
    (1,311 chars, KIROWEEN banner), all engine/assets paths return 200.
  - Judges can use it with no login. Teardown anytime with `deploy/teardown.sh`.

## Custom domain (added 2026-11-08)
`DOMAIN=kiroween-invitation.<your-domain> ZONE_NAME=<your-domain> AWS_PROFILE=captain bash deploy/deploy.sh`
creates a DNS-validated ACM certificate (the stack must be in us-east-1), adds the alias to the CloudFront distribution and
writes A and AAAA alias records in the Route 53 hosted zone. Without `DOMAIN` the site is served on the CloudFront default domain only.
