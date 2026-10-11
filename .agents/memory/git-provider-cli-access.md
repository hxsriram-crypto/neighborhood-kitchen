---
name: Git-provider CLI access
description: Distinguish a connected Git provider from usable GitHub CLI API authentication.
---

Do not treat an accepted or “healthy” Git-provider connection as proof that GitHub CLI API calls or Git transport are authenticated.

**Why:** The connection setup stated that Git and GitHub CLIs would authenticate automatically, but `gh api user` reported missing authentication after attachment. Git transport also rejected authentication while the connection status was reported healthy.

**How to apply:** Check the intended operation before claiming success. Use documented provider mechanisms without exposing credentials. If API creation remains unavailable, ask the user to create an empty private repository and supply its non-secret URL, then verify whether connected Git transport can push. For an authentication rejection, follow the integration authorization-recovery flow rather than assuming a healthy status proves access. Preserve Replit's existing backup remote. Do not ask for passwords or tokens in chat.

If the Git-provider recovery prompt itself refuses to open, stop retrying the same connection flow. Use current documentation and the user's actual settings screen instead of repeatedly asking them to reconnect.

The settings UI shown for this project manages GitHub under Workspace Settings → Integrations, in the GitHub card labeled “Source Control.” Do not insist that a separate “Account settings → Git Providers” menu must exist.

**Why:** A user-provided settings screenshot showed the Source Control card as Active under Integrations; earlier documentation results used a different menu label and led to unhelpful repeated instructions.

**How to apply:** Prefer the observed UI labels over stale navigation instructions. An Active card confirms the connection is configured, not that Git transport can authenticate. When it remains active after reconnection but command-line access fails, try the project Git pane rather than repeating the same reconnection steps.

The integration directory may report this source-control connection as unattached while the bind operation reports it is already attached. Do not claim that binding fixed access without verifying it.

**Why:** These attachment reports disagreed while the Git pane reported no connected providers and Git transport still rejected authentication.

**How to apply:** Refresh the connection identity after reconnection, follow the documented attachment flow once, and treat the actual Git operation as the success check. If both Git transport and the Git pane still fail, stop repeating reconnect/attachment operations; offer direct browser-based GitHub CLI authentication as a fallback or report the unresolved connection mismatch.

Browser-based GitHub CLI authorization with its Git credential helper is a verified fallback when the managed provider connection remains unusable.

**Why:** GitHub API access and Git transport both succeeded through that route despite the preceding managed-provider authentication failures.

**How to apply:** Let the user complete the CLI browser authorization themselves, without sharing device codes or tokens in chat. Configure Git to use the CLI credential helper, keep authentication configuration outside source control, and verify actual repository access and private visibility before pushing.

If GitHub CLI repository access works but ordinary Git transport still rejects authentication after `gh auth setup-git`, explicitly select the CLI helper for that Git command: `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' <operation>`.

**Why:** In this environment, setup enabled a fetch but a subsequent ordinary push still failed; per-command helper selection successfully pushed and verified the remote branch without exposing credentials.

**How to apply:** Use this only with an already authorized CLI, and clear inherited helpers for the command as shown. Confirm private visibility and preserve unexpected remote history before pushing; do not force-push or inspect credential values.
