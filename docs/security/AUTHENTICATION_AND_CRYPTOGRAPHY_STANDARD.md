# Authentication And Cryptography Standard

Owner: Engineering lead  
Review cadence: Quarterly and after material auth or infrastructure changes  
Status: Baseline identified

This standard defines the minimum baseline for secure authentication information and approved cryptographic use in Kollegan engineering and operations.

## Authentication Baseline

- Use least privilege, named access, and periodic access review for admin, repository, VPS, database, and CI/CD access.
- Avoid shared accounts unless explicitly documented with compensating controls.
- Keep secrets, tokens, passwords, and private keys out of the repository.
- Prefer stronger administrative authentication controls, including MFA-capable paths where supported by the provider.

## Cryptography Baseline

- Use established platform, framework, and provider cryptography rather than custom cryptographic design.
- Protect credentials and tokens outside the repository and transfer them only through approved operational channels.
- Use secure transport for production-facing and administrative paths as provided by the deployment, hosting, and application stack.
- Do not commit signing material, credentials, or secret cryptographic artifacts to the repository.

## Related Evidence

- `docs/security/ACCESS_CONTROL.md`
- `docs/security/AI_USAGE_POLICY.md`
- `docs/PRODUCTION_DATA_SAFETY.md`
- `.github/workflows/deploy.yml`
