---
title: atomFamily(options)
sidebar_label: atomFamily()
---

Returns a function that returns a writeable `RecoilState` [atom](/docs/api-reference/core/atom).

---

```jsx
function atomFamily<T, Parameter>({
  key: string,

  default:
    | RecoilValue<T>
    | Promise<T>
    | T
    | (Parameter => T | RecoilValue<T> | Promise<T>),

  dangerouslyAllowMutability?: boolean,
}): Parameter => RecoilState<T>
```

- `key` - A unique string used to identify the atom internally. This string should be unique with respect to other atoms and selectors in the entire application.
- `default` - The initial value of the atom. It may either be a value directly, a `RecoilValue` or `Promise` that represents the default value, or a function to get the default value. The callback function is passed a copy of the parameter used when the `atomFamily` function is called.

---

An `atom` represents a piece of state with _Recoil_. An atom is created and registered per `<RecoilRoot>` by your app. But, what if your state isn’t global? What if your state is associated with a particular instance of a control, or with a particular element? For example, maybe your app is a UI prototyping tool where the user can dynamically add elements and each element has state, such as its position. Ideally, each element would get its own atom of state. You could implement this yourself via a memoization pattern. But, _Recoil_ provides this pattern for you with the `atomFamily` utility. An Atom Family represents a collection of atoms. When you call `atomFamily` it will return a function which provides the `RecoilState` atom based on the parameters you pass in.

The `atomFamily` essentially provides a map from the parameter to a atom.  You only need to provide a single key for the `atomFamily` and it will generate a unique key for each underlying atom.  These atom keys can be used for persistence, and so must be stable across application executions.  The parameters may also be generated at different callsites and we want equivalent parameters to use the same underlying atom.  Therefore, value-equality is used instead of reference-equality for `atomFamily` parameters.  This imposes restrictions on the types which can be used for the parameter.  `atomFamily` accepts primitive types, or arrays or objects which can contain arrays, objects, or primitive types.

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

An `atomFamily()` takes almost the same options as a simple [`atom()`](/docs/api-reference/core/atom).  However, the default value can also be parameterized. That means you could provide a function which takes the parameter value and returns the actual default value.  For example:

```jsx
const myAtomFamily = atomFamily({
  key: ‘MyAtom’,
  default: param => defaultBasedOnParam(param),
});
```

or using [`selectorFamily`](/docs/api-reference/utils/selectorFamily) instead of `selector`, you can also access the parameter value in a `default` selector as well.

```jsx
const myAtomFamily = atomFamily({
  key: ‘MyAtom’,
  default: selectorFamily({
    key: 'MyAtom/Default',
    get: param => ({get}) => {
      return computeDefaultUsingParam(param);
    },
  }),
});
```

## Subscriptions

One advantage of using this pattern for separate atoms for each element over trying to store a single atom with a map of state for all elements is that they all maintain their own individual subscriptions. So, updating the value for one element will only cause React components that have subscribed to just that atom to update.

## Persistence

Persistence observers will persist the state for each parameter value as a distinct atom with a unique key based on serialization of the parameter value used. Therefore, it is important to only use parameters which are primitives or simple compound objects containing primitives. Custom classes or functions are not allowed.

It is allowed to “upgrade” a simple `atom` to be an `atomFamily` in a newer version of your app based on the same key. If you do this, then any persisted values with the old simple key can still be read and all parameter values of the new `atomFamily` will default to the persisted state of the simple atom. If you change the format of the parameter in an `atomFamily`, however, it will not automatically read the previous values that were persisted before the change. However, you can add logic in a default selector or validator to lookup values based on previous parameter formats. We hope to help automate this pattern in the future.
