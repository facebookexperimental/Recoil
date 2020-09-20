---
title: Motivação
---

For reasons of compatibility and simplicity, it's best to use React's built-in state management capabilities rather than external global state. But React has certain limitations:

- Component state can only be shared by pushing it up to the common ancestor, but this might include a huge tree that then needs to re-render.
- Context can only store a single value, not an indefinite set of values each with its own consumers.
- Both of these make it difficult to code-split the top of the tree (where the state has to live) from the leaves of the tree (where the state is used).

We want to improve this while keeping both the API and the semantics and behavior as Reactish as possible.

Recoil defines a directed graph orthogonal to but also intrinsic and attached to your React tree. State changes flow from the roots of this graph (which we call atoms) through pure functions (which we call selectors) and into components. With this approach:

- We get a boilerplate-free API where shared state has the same simple get/set interface as React local state (yet can be encapsulated with reducers etc. if needed).
- We have the possibility of compatibility with Concurrent Mode and other new React features as they become available.
- The state definition is incremental and distributed, making code-splitting possible.
- State can be replaced with derived data without modifying the components that use it.
- Derived data can move between being synchronous and asynchronous without modifying the components that use it.
- We can treat navigation as a first-class concept, even encoding state transitions in links.
- It's easy to persist the entire application state in a way that is backwards-compatible, so persisted states can survive application changes.
