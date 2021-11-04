---
title: useGetRecoilValueInfo_UNSTABLE()
sidebar_label: useGetRecoilValueInfo()
---

This hook allows a component to "peek" at the current state, value, and other information about an atom or selector.  This is similar to the `getInfo_UNSTABLE()` method in [`Snapshot`](/docs/api-reference/core/Snapshot#debug-information) and [atom effects](/docs/guides/atom-effects)


```jsx
function useGetRecoilValueInfo_UNSTABLE(): RecoilValue<T> => RecoilValueInfo<T>;

interface RecoilValueInfo<T> {
  loadable?: Loadable<T>;
  isActive: boolean;
  isSet: boolean;
  isModified: boolean; // TODO report modified selectors
  type: 'atom' | 'selector' | undefined; // undefined until initialized for now
  deps: Iterable<RecoilValue<T>>;
  subscribers: {
    nodes: Iterable<RecoilValue<T>>,
    components: Iterable<ComponentInfo>,
  };
}

interface ComponentInfo {
  name: string;
}
```

It provides a function which can be passed a `RecoilValue<T>` and will return an object which contains current information about that atom/selector.  It will not cause any state to change or create any subscriptions.  It is primarily intended for use in debugging or dev tools.

The debug information is evolving, but may include:
* `loadable` - A Loadable with the current state.  Unlike methods like `getLoadable()`, this method will not mutate the snapshot at all.  It provides the current state and will not initialize new atoms/selectors, perform any new selector evaluations, or update any dependencies or subscriptions.
* `isSet` - True if this is an atom with an explicit value stored in the snapshot state.  False if this is a selector or using the default atom state.
* `isModified` - True if this is an atom which was modified since the last transaction.
* `type` - Either an `atom` or `selector`
* `deps` - An iterator over the atoms or selectors this node depends on.
* `subscribers` - Information about what is subscribing to this node for this snapshot.  Details under development.

### Example

```jsx
function ButtonToShowCurrentSubscriptions() {
  const getRecoilValueInfo = useGetRecoilValueInfo_UNSTABLE();
  function onClick() {
    const {subscribers} = getRecoilValueInfo(myAtom);
    console.debug(
      'Current Subscriber Nodes:',
      Array.from(subscribers.nodes).map(({key}) => key),
    );
  }

  return <button onClick={onClick} >See Current Subscribers</button>;
}
```
