---
name: Git-provider CLI access
description: Distinguish a connected Git provider from usable GitHub CLI API authentication.
---

Do not treat an accepted Git-provider connection as proof that `gh` API commands are authenticated.

**Why:** The connection setup stated that Git and GitHub CLIs would authenticate automatically, but `gh api user` still reported missing authentication after attachment. No repository creation was confirmed.

**How to apply:** Check the intended operation before claiming success. Use documented provider mechanisms without exposing credentials. If API creation remains unavailable, ask the user to create an empty private repository and supply its non-secret URL, then verify whether connected Git transport can push. Preserve Replit's existing backup remote. Do not ask for passwords or tokens in chat.
