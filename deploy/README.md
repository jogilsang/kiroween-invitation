# Deploy — ASCII Invite

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

- Template structurally validated offline (4 resources, 3 outputs; private
  bucket + OAC + CloudFront + scoped bucket policy).
- `stage.mjs` verified: produces a correct flat `dist/` with rewritten paths.
- **Not yet deployed.** AWS `validate-template` and the real deploy need a live
  captain session (it was expired at build time) and are gated on CEO go, since
  deploying creates real AWS resources. Run the two commands above when ready.
