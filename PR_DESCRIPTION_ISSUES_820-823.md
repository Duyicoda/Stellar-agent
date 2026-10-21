## Description

<!-- What does this PR change, and why? -->

Addresses four dashboard issues: expired limiter buckets are pruned, SEP-0010 challenges are rate-limited and single-use with a five-minute TTL, configured CORS origins are validated, and job lifecycle updates can be streamed through a per-job SSE endpoint and the SDK `subscribeJob` helper.

Focused dashboard tests passed: 7/7. SDK subscription test passed: 1/1. Full dashboard checks remain blocked by pre-existing issues: `npm --prefix dashboard test` fails because `dashboard/public/app.test.js` uses CommonJS `require` in an ESM package, and dashboard typecheck fails on parse errors in `dashboard/lib/validator.ts`. GitHub Actions have not run because no PR has been opened.

## Related issue

- Closes sonoflawal-1/Stellar-agent#820
- Closes sonoflawal-1/Stellar-agent#821
- Closes sonoflawal-1/Stellar-agent#822
- Closes sonoflawal-1/Stellar-agent#823

> Note: This branch is pushed to `BishopX01/Stellar-agent`, while the issues are in `sonoflawal-1/Stellar-agent`. GitHub may not auto-close issues across repositories when this PR is merged.

## Type of change

- [x] `feat:` New feature
- [x] `fix:` Bug fix
- [ ] `docs:` Documentation only
- [ ] `refactor:` Code reorganization (no feature or bug fix)
- [ ] `chore:` Tooling, dependency updates, build scripts

## Checklist

- [x] Unit tests added/updated
- [x] Documentation updated
- [ ] WASM size impact reviewed (if contract code changed)
- [ ] CI passes
