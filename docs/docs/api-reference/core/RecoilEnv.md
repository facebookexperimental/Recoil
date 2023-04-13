---
title: Recoil Environment
sidebar_label: Recoil Environment
---

## `RecoilEnv`

`RecoilEnv` is an object that contains Recoil environment variables which may be read or set.

- **`RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED`**: `boolean` - Useful to disable duplicate atom/selector key checking in environments where modules may be legitimately reloaded such as NextJS or when using React's Fast Refresh during development. As this disables all checks including legitimate errors, please use with caution.
- **`RECOIL_GKS_ENABLED`**: `Set<string>` - Recoil contains a set of unstable behavior-changing internal flags called gatekeepers (GKs). These flags are gradually rolled into the regular Recoil release as they are tested, improved, and stabilized. This variable allows you to opt in to additional flags if you would like to try new experimental features.

  To enable a GK, add it to the set _before_ you create your first `<RecoilRoot>`:

  ```jsx
  RecoilEnv.RECOIL_GKS_ENABLED.add('recoil_transition_support');
  ```

  A partial list of available flags:

  - **`recoil_hamt_2020`** (_enabled by default_) - Switches the `Map<K, V>` implementation to a [hash array mapped trie](https://en.wikipedia.org/wiki/Hash_array_mapped_trie)
  - **`recoil_sync_external_store`** (_enabled by default_) - Enables support for [`useSyncExternalStore()`](https://react.dev/reference/react/useSyncExternalStore) if the version of React being used provides it.
  - **`recoil_suppress_rerender_in_callback`** (_enabled by default_) - Avoids rerendering components when selector values don't change, compared by reference equality.
  - **`recoil_memory_managament_2020`** (_enabled by default_) - Implements garbage collection by automatically releasing the contents of atoms and selectors when they no longer used by any components when configured in the atom definition.
  - **`recoil_transition_support`** - Enables support for [React transitions](/docs/guides/transitions) and [`useTransition()`](https://react.dev/reference/react/useTransition) by default instead of needing to use the `*_TRANSITION_SUPPORT_UNSTABLE()` hooks; takes precedence over `recoil_sync_external_store`.

## NodeJS

The environment variables can also be initialized in NodeJS environments, such as NextJs, by setting `process.env`. Variables set from `process.env` are parsed according to their data type:

- `boolean` - Either `true` or `false`, case insensitive
- `Set<string>` - A space- or comma-separated list of strings, e.g. `a b c` or `a,b,c` respectively, that are added to any values present in the set by default (it is not currently possible to overwrite the entire set)

---
