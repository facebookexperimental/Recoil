---
title: Motivation
---

Managing state is hard. As your app grows, you'll discover interconnected data dependencies between deeply nested components. You can promote this common data to React Context, but in doing so you'll end up coupling the top of your component tree (your providers) with the leaves of the tree (your consumers), making it difficult to code-split.

Popular state management libraries tend to require too much boilerplate and/or don't support common patterns out of the box, including **persistence** (i.e saving state to the URL), **code-splitting**, and first-class support for managing asynchronous state using hooks and Suspense.

Recoil was created to solve these issues. Below are some highlights:

- Recoil has minimal boilerplate.
- Recoil exposes a simple get/set interface, similar to React state.
- Recoil is built with Suspense, Concurrent Rendering, and Hooks in mind.
- Derived state in recoil can move between being synchronous and asynchronous without modifying the components that use it.
- Recoil's state definition is incremental and distributed, making code-splitting possible.
- Recoil treats browser navigation as a first-class concept. You can encode state transitions into links, which can then be opened in a new tab.
- Recoil makes it easy to persist the entire application state in a way that is backwards-compatible, so persisted states can survive application changes.
