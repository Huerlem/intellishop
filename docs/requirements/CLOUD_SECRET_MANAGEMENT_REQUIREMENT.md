# ADDITIONAL MANDATORY REQUIREMENT — CLOUD SECRET MANAGEMENT (P0)

Received from the owner on 2026-10-27. Recorded verbatim in substance.

Integrate this requirement into the existing IntelliShop V2 development branch, without restarting the project or discarding approved work.
All private third-party API credentials must be stored securely in the cloud and accessed exclusively through authorised backend services.

Required implementation:

1. Use Google Cloud Secret Manager integrated with Firebase Cloud Functions v2.
2. Use `defineSecret()` and bind secrets only to the functions that require them.
3. Remove all private API credentials from mobile application code, `eas.json`, public environment variables, and tracked configuration.
4. Replace all direct client-side calls to private AI providers with authenticated backend calls.
5. Rotate or revoke exposed credentials before introducing replacement keys.
6. Apply least-privilege IAM permissions, Firebase Auth verification, App Check enforcement where supported, rate limiting, quotas and safe error handling.
7. Separate development, staging and production configuration.
8. Update `.gitignore`, provide safe `.env.example` documentation, and enable automated secret scanning.
9. Ensure that logs, crash reports, build artifacts and analytics never expose credentials or sensitive user content.
10. Audit the entire Git history for leaked credentials without printing their values.

Important distinctions:

- Firebase client configuration is not equivalent to a private provider key.
- EAS Secrets protect build-time values, but do not protect credentials embedded in the compiled application.
- Never introduce replacement secrets through GitHub commits or chat messages.
- Do not force-push, rewrite repository history or delete cloud resources without explicit approval.

Required evidence: `docs/SECURITY_CLOUD_SECRETS_IMPLEMENTATION.md` documenting the architecture, affected services, migration steps, credential rotation status, IAM controls, test evidence and outstanding risks.

Acceptance criteria:

- No private provider keys are embedded in iOS builds.
- No mobile production path calls a private provider directly using an embedded credential.
- Backend functions retrieve the required secrets securely.
- Unauthenticated and unauthorised requests are rejected.
- Secret rotation can occur without releasing a new mobile binary.
- The end-to-end AI recipe feature operates through the secure backend.

Mark each criterion PASS, FAIL, BLOCKED or NOT TESTED. Do not claim completion without executable validation.
Treat this as a release-blocking requirement and implement it before enabling production AI integrations.
