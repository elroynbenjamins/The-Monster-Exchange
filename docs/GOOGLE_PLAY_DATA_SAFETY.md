# Google Play privacy and Data safety release guide

This file is an internal release checklist. The public-facing policy is [`PRIVACY.md`](../PRIVACY.md).

## Current codebase declaration

Based on the repository as of August 28, 2026, the planned release is local-only: it has no network transport, account system, analytics, advertising, telemetry, cloud save, payment SDK, or developer-operated crash reporting.

For a build that exactly matches this codebase, the Google Play Console Data safety answers should therefore state:

- **Does the app collect or share any required user data types?** No.
- **Is all user data encrypted in transit?** Not applicable because the app does not transmit user data.
- **Can users request deletion?** No account is created and no user data is collected by the developer. Local data can be deleted through Android app-storage settings or by uninstalling.
- **Data sold or shared for advertising:** None.

These are release notes, not permanent answers. The declaration must describe the exact production binary, including every SDK and service bundled at build time.

## Required Play Console setup

1. Publish `PRIVACY.md` at a public, non-editable web URL. After this repository is public, the GitHub rendered-file URL may be used; a small GitHub Pages privacy page is preferable.
2. Put that same URL in **Play Console → App content → Privacy policy** and in the app or store listing where required.
3. Complete **App content → Data safety** using the current declaration above.
4. Confirm the target-audience and Families answers match the actual store listing and game content.
5. Review Android permissions in the final app bundle. Remove any permission that is not necessary for an advertised feature.
6. Re-run this review for every release and whenever dependencies change.

## Changes that require a privacy review

Do not ship any of the following until both the privacy policy and Data safety form are updated:

- analytics, diagnostics, telemetry, or crash-reporting SDKs;
- advertisements, attribution, or advertising identifiers;
- accounts, authentication, profiles, friends, chat, or multiplayer;
- developer-operated cloud saves, leaderboards, or servers;
- purchases, subscriptions, or payment-related services;
- push notifications or marketing communication;
- precise or approximate location;
- access to contacts, photos, files, camera, or microphone; or
- any SDK that independently collects device or user data.

For each addition, document the data type, purpose, whether collection is optional, retention period, deletion process, encryption in transit, and every recipient or processor.

## Release verification

- [ ] Production package ID is `com.elroybenjamins.themonsterexchange`.
- [ ] Public privacy-policy URL opens without login.
- [ ] Policy names The Monster Exchange and includes a working privacy contact.
- [ ] Policy behavior matches the production binary and bundled SDKs.
- [ ] Data safety answers match the policy and binary.
- [ ] Final Android permissions have been reviewed.
- [ ] Store target-audience declarations have been reviewed.
- [ ] Policy effective date has been checked for this release.

