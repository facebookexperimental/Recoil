---
title: Core Concepts
---

## Atoms

An **atom** represents a piece of **state**. Atoms can be read from and written to from any component. Components that read the value of an atom are implicitly **subscribed** to that atom, so any atom updates will result in a re-render of all components subscribed to that atom.

To define an atom, use the `atom()` function:

```javascript
const fontSizeState = atom({
  key: 'fontSizeState',
  default: 14,
});
```

The `key` property must be a unique string (with respect to other atoms/selectors) that will be used to identify the atom internally. The `default` property holds the initial value of the atom.

To read/write `fontSizeState`, we can use the `useRecoilState()` hook, which returns a tuple containing the state value and a **setter function** that can update the atom's value when called:

```jsx
function FontButton() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  const increaseFontSizeByOne = () => setFontSize(fontSize + 1);

  return (
    <button onClick={increaseFontSizeByOne} style={{fontSize}}>
      Click Me!
    </button>
  );
}
```

Clicking on the button will increase the font size of the button by one. Because `fontSizeState` is an atom, it can be read by any component, and all components that read `fontSizeState` will re-render when its value changes.

## Selectors

A **selector** represents a piece of **derived state**. Derived state is a **transformation** of state. You can think of derived state as the output of passing state to a pure function that modifies the given state in some way. Examples include unit/format/language conversions (synchronous) and API calls (asynchronous). For more information on asynchronous selectors, see the [selector API reference](/docs/api-reference/core/selector).

To define a selector, use the `selector()` function:

```javascript
const fontSizeLabelState = selector({
  key: 'fontSizeLabelState',
  get: ({get}) => {
    const fontSize = get(fontSizeState);
    const unit = 'px';

    return `${fontSize}${unit}`;
  },
});
```

The `key` property must be a unique string (with respect to other atoms/selectors) that will be used to identify the selector internally. The `get` property is assigned a function whose first parameter can be destructured to extract a `get()` function that can read the value of other atoms/selectors.

When a selector reads the value of another atom/selector, it will internally add that atom/selector to a list of dependencies so that if any of those dependencies change, the selector will re-evaluate. In the `fontSizeLabelState` example, the selector has one dependency: the `fontSizeState` atom.

Conceptually, the `fontSizeLabelState` selector behaves like a pure function that takes a `fontSizeState` as input and returns a formatted font size label as output.

Selectors can be read using `useRecoilValue()`, which takes an atom/selector as its first parameter and returns the corresponding value. Note we can't use `useRecoilState()` as the `fontSizeLabelState` selector is not writeable (see the [selector API reference](/docs/api-reference/core/selector) for more information on writeable selectors):

```jsx
function FontButton() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  const increaseFontSizeByOne = () => setFontSize(fontSize + 1);

  const fontSizeLabel = useRecoilValue(fontSizeLabelState);

  return (
    <>
      <div>Current font size: ${fontSizeLabel}</div>

      <button onClick={increaseFontSizeByOne} style={{fontSize}}>
        Click Me!
      </button>
    </>
  );
}
```

Clicking on the button now does two things: it increases the font size of the button while also updating the font size label to reflect the current font size.
