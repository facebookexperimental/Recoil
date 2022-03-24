---
title: atomFamily(options)
sidebar_label: atomFamily()
---

Returns a function that returns a writeable `RecoilState` [atom](/docs/api-reference/core/atom).

---

```jsx
function atomFamily<T, Parameter>({
  key: string,

  default?:
    | T
    | Promise<T>
    | Loadable<T>
    | WrappedValue<T>
    | RecoilValue<T>
    | (Parameter => T | Promise<T> | Loadable<T> | WrappedValue<T> | RecoilValue<T>),

  effects?:
    | $ReadOnlyArray<AtomEffect<T>>
    | (P => $ReadOnlyArray<AtomEffect<T>>),

  dangerouslyAllowMutability?: boolean,
}): Parameter => RecoilState<T>
```

- `key` - A unique string used to identify the atom internally. This string should be unique with respect to other atoms and selectors in the entire application.
- `default` - The initial value of the atom.  Like an atom, it may either be a value directly or a `Promise`, [`Loadable`](/docs/api-reference/core/Loadable), wrapped value, or another atom/selector that represents the default value.  Atom families can also be a function that is passed a parameter and returns the default for that family member.  If not provided, the atom will start in a pending state and trigger Suspense.
- `effects` - An optional array, or callback to get the array based on the family parameter, of [Atom Effects](/docs/guides/atom-effects).
- `dangerouslyAllowMutability` - Recoil depends on atom state changes to know when to notify components that use the atoms to re-render.  If an atom's value were mutated, it may bypass this and cause state to change without properly notifying subscribing components.  To help protect against this all stored values are frozen.  In some cases it may be desireable to override this using this option.

---

An `atom` represents a piece of state with _Recoil_. An atom is created and registered per `<RecoilRoot>` by your app. But, what if your state isn’t global? What if your state is associated with a particular instance of a control, or with a particular element? For example, maybe your app is a UI prototyping tool where the user can dynamically add elements and each element has state, such as its position. Ideally, each element would get its own atom of state. You could implement this yourself via a memoization pattern. But, _Recoil_ provides this pattern for you with the `atomFamily` utility. An Atom Family represents a collection of atoms. When you call `atomFamily` it will return a function which provides the `RecoilState` atom based on the parameters you pass in.

The `atomFamily` essentially provides a map from the parameter to an atom.  You only need to provide a single key for the `atomFamily` and it will generate a unique key for each underlying atom.  These atom keys can be used for persistence, and so must be stable across application executions.  The parameters may also be generated at different callsites and we want equivalent parameters to use the same underlying atom.  Therefore, value-equality is used instead of reference-equality for `atomFamily` parameters.  This imposes restrictions on the types which can be used for the parameter.  `atomFamily` accepts primitive types, or arrays or objects which can contain arrays, objects, or primitive types.

## Example

```jsx
const elementPositionStateFamily = atomFamily({
  key: 'ElementPosition',
  default: [0, 0],
});

function ElementListItem({elementID}) {
  const position = useRecoilValue(elementPositionStateFamily(elementID));
  return (
    <div>
      Element: {elementID}
      Position: {position}
    </div>
  );
}
```

## Family Defaults

An `atomFamily()` takes almost the same options as a simple [`atom()`](/docs/api-reference/core/atom).  However, the default value can also be parameterized. That means you could provide a function which takes the parameter value and returns the actual default value.  For example:

```jsx
const myAtomFamily = atomFamily({
  key: ‘MyAtom’,
  default: param => defaultBasedOnParam(param),
});
```

For dynamic defaults based on other state use a [`selectorFamily()`](/docs/api-reference/utils/selectorFamily), which also has access to the parameter value.  Don't just use `selector()` for `atomFamily()` defaults, as it would produce duplicate keys.

```jsx
const myAtomFamily = atomFamily({
  key: ‘MyAtom’,
  default: selectorFamily({
    key: 'MyAtom/Default',
    get: param => ({get}) => {
      const otherAtomValue = get(otherState);
      return computeDefaultUsingParam(otherAtomValue, param);
    },
  }),
});
```

## Subscriptions

One advantage of using this pattern for separate atoms for each element over trying to store a single atom with a map of state for all elements is that they all maintain their own individual subscriptions. So, updating the value for one element will only cause React components that have subscribed to just that atom to update.

## Scoped Atoms

Sometimes you may want to "scope" atom state by some other prop, React Context, or piece of state.  For example:

```jsx
const viewWidthForPaneState = atomFamily<number, PaneID>({
  key: 'ViewWidthForPane',
  default: 42,
});

function PaneView() {
  const paneID = useContext(PaneIDContext);
  const viewWidth = useRecoilValue(viewWidthForPaneState(paneID));
  ...
}
```

If you want to scope by some other Recoil state and wish to avoid looking up the scope parameter at every call site, it can be a useful pattern to use a wrapper [`selector()`](/docs/api-reference/core/selector):

```jsx
const viewWidthState = selector({
  key: 'ViewWidth',
  get: ({get}) => viewWidthForPane(get(currentPaneState)),
  set: ({get, set}, newValue) => set(viewWidthForPane(get(currentPaneState)), newValue),
});

function PaneView() {
  const viewWidth = useRecoilValue(viewWidthState);
  ...
}
```

## Persistence

Persistence observers will persist the state for each parameter value as a distinct atom with a unique key based on serialization of the parameter value used. Therefore, it is important to only use parameters which are primitives or simple compound objects containing primitives. Custom classes or functions are not allowed.
