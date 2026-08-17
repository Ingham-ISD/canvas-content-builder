# Canvas Content Builder — Store Release Checklist

## Completed in this project

- Production extension manifest with icons and no broad `https://*/*` optional-host permission.
- First-use data-use notice before any AI request.
- Browser-side API key protection: the key remains in Apps Script Script Properties.
- Privacy-policy template and Store listing copy.
- A packaging script that excludes source notes, test material, prompts, and Apps Script source.

## You must complete before submitting

1. Have the district review and approve `PRIVACY_POLICY_TEMPLATE.html`, then confirm the BrainFreeze/Airia tenant&rsquo;s actual retention, logging, administrator-access, and end-user-privacy settings. Update the policy if the tenant settings differ from the vendor baseline described there.
2. Host the finalized privacy policy at a stable, publicly reachable district-controlled HTTPS URL. Paste that URL into the Chrome Web Store Privacy tab.
3. Capture at least one accurate screenshot of the running extension at **1280 × 800**. Do not use generated or mocked screenshots as Store evidence.
4. Create a 440 × 280 promo tile. It must accurately represent Canvas Content Builder and avoid claims such as “#1” or “official Canvas.”
5. Confirm the district approves the described Airia use, data handling, and teacher guidance.
6. Register the durable district-owned Chrome Web Store developer account and enable two-step verification.
7. Run `store\PACKAGE_EXTENSION.ps1` to create the ZIP. Upload only the generated ZIP.
8. Submit as **Private / trusted testers** first. The deployed Apps Script proxy is restricted to the Ingham ISD Workspace domain.
9. If Chrome is centrally managed, ask the Google Admin/IT team to allow the extension ID after the Store creates it.

## Store Dashboard values

- Name: `Canvas Content Builder`
- Category: `Productivity`
- Visibility for pilot: `Private / trusted testers`
- Privacy policy: the hosted finalized policy URL
- Support: district help desk/contact
- Single purpose: help authorized educators plan, create, revise, and manage Canvas LMS instructional content using the organization-managed AI service.

## Required tester script

Ask testers to confirm:

1. They see and can acknowledge the data-use notice.
2. Chat can receive an uploaded scope-and-sequence.
3. Build produces a reviewable unpublished plan.
4. Page Editor can insert and replace content only after a teacher reviews it.
5. Assessment Studio keeps answer-key warnings visible.
6. Bulk Rebuild presents individual previews before applying changes.
7. Google Drive URLs are not falsely claimed as readable.
