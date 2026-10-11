---
name: Git-provider CLI access
description: Distinguish a connected Git provider from usable GitHub CLI API authentication.
---

Do not treat an accepted or “healthy” Git-provider connection as proof that GitHub CLI API calls or Git transport are authenticated.

**Why:** The connection setup stated that Git and GitHub CLIs would authenticate automatically, but `gh api user` reported missing authentication after attachment. Git transport also rejected authentication while the connection status was reported healthy.

**How to apply:** Check the intended operation before claiming success. Use documented provider mechanisms without exposing credentials. If API creation remains unavailable, ask the user to create an empty private repository and supply its non-secret URL, then verify whether connected Git transport can push. For an authentication rejection, follow the integration authorization-recovery flow rather than assuming a healthy status proves access. Preserve Replit's existing backup remote. Do not ask for passwords or tokens in chat.

If the Git-provider recovery prompt itself refuses to open, stop retrying the same connection flow. Consult Replit's current Git-provider recovery documentation and direct the user to the account-level Git Providers settings, explaining that changing that connection is not repository-specific.
