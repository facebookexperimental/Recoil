---
title: RecoilEnv
sidebar_label: RecoilEnv
---

An object that contains Recoil environment variables which may be read or set.

* **`RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED`** - Useful to disable duplicate atom/selector key checking in environments where modules may be legitimately reloaded such as NextJS or when using React's Fast Refresh during development.  As this disables all checks including legitimate errors, please use with caution.

## NodeJS

The environment variables can also be initialized in NodeJS environments, such as NextJs, by setting `process.env`.

---
