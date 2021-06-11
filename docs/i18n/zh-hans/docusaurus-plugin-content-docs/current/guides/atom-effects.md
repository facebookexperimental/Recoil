---
title: Atom Effects
sidebar_label: Atom Effects
---

Atom Effects 是一个新的实验性 API，用于管理副作用和初始化 Recoil atom。它们有很多有用的应用，比如状态持久化、状态同步、管理历史、日志等。它们被定义为 atom 定义的一部分，所以每个 atom 都可以指定和组成它们自己的策略。这个 API 目前仍在发展中，因此被标记为 `_UNSTABLE`。

----
## *重要提示*
***这个 API 目前正在开发中，未来会有变化。请继续关注……***

----

*Atom effect* 是一个 *函数*，其定义如下：

```jsx
type AtomEffect<T> = ({
  node: RecoilState<T>, // 对 atom 本身的引用
  trigger: 'get' | 'set', // 触发 atom 初始化的行动

  // 用于设置或重置 atom 值的回调。
  // 可以从 atom effect 函数中直接调用，以初始化
  // atom 的初始值，或者在以后异步调用以改变它。
  setSelf: (
    | T
    | DefaultValue
    | Promise<T | DefaultValue> // 目前只能用于初始化
    | ((T | DefaultValue) => T | DefaultValue),
  ) => void,
  resetSelf: () => void,

  // 订阅 atom 值的变化。
  // 由于这个 effect 自己的 setSelf() 的变化，该回调没有被调用。
  onSet: (
    (newValue: T | DefaultValue, oldValue: T | DefaultValue) => void,
  ) => void,

}) => void | () => void; // 可以返回一个清理程序
```

Atom effects 通过 `effects_UNSTABLE` 选项附加到 [atoms](/docs/api-reference/core/atom)。每个 atom 都可以引用这些 atom effect 函数的一个数组，当 atom 被初始化时，这些函数会按优先级顺序被调用。atom 在 `<RecoilRoot>` 内首次使用时被初始化，但如果它们未被使用并被清理，则可再次被重新初始化。Atom effect 函数可以返回一个可选的清理处理程序来管理清理的副作用。

```jsx
const myState = atom({
  key: 'MyKey',
  default: null,
  effects_UNSTABLE: [
    () => {
      ...effect 1...
      return () => ...cleanup effect 1...;
    },
    () => { ...effect 2... },
  ],
});
```

[Atom 族](/docs/api-reference/utils/atomFamily) 也支持参数化以及非参数化的 effect ：

```jsx
const myStateFamily = atomFamily({
  key: 'MyKey',
  default: null,
  effects_UNSTABLE: param => [
    () => {
      ...effect 1 using param...
      return () => ...cleanup effect 1...;
    },
    () => { ...effect 2 using param... },
  ],
});
```

### 与 React Effects 相比

Atom effect 大多可以通过 React `useEffect()` 来实现。然而，这组 atom 是在 React 上下文之外创建的，从 React 组件中管理 effect 会很困难，特别是对于动态创建的 atom。它们也不能用于初始化初始 atom 值或用于服务器端的渲染。使用 atom effect 还可以将 effect 与 atom 定义一起定位。

```jsx
const myState = atom({key: 'Key', default: null});

function MyStateEffect(): React.Node {
  const [value, setValue] = useRecoilState(myState);
  useEffect(() => {
    // 当 atom 值改变时被调用
    store.set(value);
    store.onChange(setValue);
    return () => { store.onChange(null); }; // 清理 effect
  }, [value]);
  return null;
}

function MyApp(): React.Node {
  return (
    <div>
      <MyStateEffect />
      ...
    </div>
  );
}
```

### 与 Snapshots 相比

[`Snapshot hooks`](/docs/api-reference/core/Snapshot#hooks) API 也可以监视 atom 的状态变化，并且 [`<RecoilRoot>`](/docs/api-reference/core/RecoilRoot) 中的 `initializeState` prop 可以初始化初始渲染值。不过，这些 API 监控所有的状态变化，在管理动态 atom —— 特别是 atom 族时 —— 可能会很尴尬。有了 atom effect，副作用可以与 atom 定义一起按 atom 定义，多个规则的组成会变得很容易。

## 日志示例

一个使用 atom effects 记录 atom 状态变化的简单例子：

```jsx
const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: null,
  effects_UNSTABLE: [
    ({onSet}) => {
      onSet(newID => {
        console.debug("Current user ID:", newID);
      });
    },
  ],
});
```

## 历史示例

一个更复杂的日志例子可能会维护一个不断变化的历史。这个例子提供了一个维护状态变化的历史队列的 effect，并有回调处理程序来撤销该特定变化。

```jsx
const history: Array<{
  label: string,
  undo: () => void,
}> = [];

const historyEffect = name => ({setSelf, onSet}) => {
  onSet((newValue, oldValue) => {
    history.push({
      label: `${name}: ${JSON.serialize(oldValue)} -> ${JSON.serialize(newValue)}`,
      undo: () => {
        setSelf(oldValue);
      },
    });
  });
};

const userInfoState = atomFamily({
  key: 'UserInfo',
  default: null,
  effects_UNSTABLE: userID => [
    historyEffect(`${userID} user info`),
  ],
});
```

## 状态同步示例

使用 atom 作为其他一些状态的本地缓存值可能很有用，比如远程数据库、本地存储等。你可以使用 `default` 属性设置 atom 的默认值，并使用选择器来获取储存的值。然而，这只是一次性的查找；如果储存的值改变了，atom 的值也不会改变。通过 effect ，我们可以订阅储存，并在储存改变时更新 atom 的值。从 effect 中调用 `setSelf()` 会将 atom 初始化为该值，并将用于初始渲染。如果 atom 被重置，它将恢复到 `default` 值，而不是初始化值。

```jsx
const syncStorageEffect = userID => ({setSelf, trigger}) => {
  // 将 atom 值初始化为远程存储状态
  if (trigger === 'get') { // 避免耗时的初始化
    setSelf(myRemoteStorage.get(userID)); // 同步调用以初始化
  }

  // 订阅远程存储变化并更新 atom 值
  myRemoteStorage.onChange(userID, userInfo => {
    setSelf(userInfo); // 异步调用以改变值
  });

  // 清理远程存储订阅
  return () => {
    myRemoteStorage.onChange(userID, null);
  };
};

const userInfoState = atomFamily({
  key: 'UserInfo',
  default: null,
  effects_UNSTABLE: userID => [
    historyEffect(`${userID} user info`),
    syncStorageEffect(userID),
  ],
});
```

## 直写式缓存实例

我们还可以将 atom 值与远程存储进行双向同步，因此服务器上的变化会更新 atom 值，而本地 atom 的变化会写回到服务器上。当通过该 effect 的 `setSelf()` 改变时，该 effect 将不调用 `onSet()` 处理程序，以帮助避免反馈循环。

```jsx
const syncStorageEffect = userID => ({setSelf, onSet, trigger}) => {
  // 将 atom 值初始化为远程存储状态
  if (trigger === 'get') { // 避免耗时的初始化
    setSelf(myRemoteStorage.get(userID)); // 同步调用以初始化
  }

  // 订阅远程存储变化并更新 atom 值
  myRemoteStorage.onChange(userID, userInfo => {
    setSelf(userInfo); // 异步调用以改变值
  });

  // 订阅本地变化并更新服务器值
  onSet(userInfo => {
    myRemoteStorage.set(userID, userInfo);
  });

  // 清理远程存储订阅
  return () => {
    myRemoteStorage.onChange(userID, null);
  };
};
```

## 本地存储的持久性

Atom Effect 可以用 [浏览器本地存储](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) 来持久化 atom 状态。`localStorage` 是同步的，所以我们可以直接检索数据而不需要 `async`、`await` 或 `Promise`。

请注意，以下例子是为说明问题而简化的，并不包括所有情况：

```jsx
const localStorageEffect = key => ({setSelf, onSet}) => {
  const savedValue = localStorage.getItem(key)
  if (savedValue != null) {
    setSelf(JSON.parse(savedValue));
  }

  onSet(newValue => {
    if (newValue instanceof DefaultValue) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(newValue));
    }
  });
};

const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: 1,
  effects_UNSTABLE: [
    localStorageEffect('current_user'),
  ]
});
```

## Asynchronous Storage Persistence

如果你的持久化数据需要异步检索，你可以在 `setSelf()` 函数中 [使用 `Promise`](#initialize-with-promise) 或者 [异步](#asynchronous-setelf) 调用它。

下面我们将使用 `AsyncLocalStorage` 或 `localForage` 作为一个异步存储的例子。

### 使用 `Promise` 进行初始化

通过同步调用 `setSelf()` 和 `Promise`，你将能够用 `<Suspense/>` 组件包裹 `<RecoilRoot/>` 内的组件，在等待 `Recoil` 加载持久值时显示一个回退。`<Suspense>` 将显示一个回退，直到提供给 `setSelf()` 的 `Promise` 被解决。如果 atom 在 `Promise` 解析之前被设置为一个值，那么初始化的值将被忽略。

请注意，如果 `atom` 后来被 “重置”，它们将恢复到其默认值，而不是初始化值。

```jsx
const localForageEffect = key => ({setSelf, onSet}) => {
  setSelf(localForage.getItem(key).then(savedValue =>
    savedValue != null
      ? JSON.parse(savedValue)
      : new DefaultValue() // 如果没有存储值，则终止初始化
  ));

  onSet(newValue => {
    if (newValue instanceof DefaultValue) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(newValue));
    }
  });
};

const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: 1,
  effects_UNSTABLE: [
    localForageEffect('current_user'),
  ]
});
```


### 异步 setSelf()

通过这种方法，你可以在值可用时异步调用 `setSelf()`。与初始化为 `Promise` 不同，最初将使用 atom 的默认值，所以 `<Suspense>` 不会显示回退，除非 atom 的默认值是 `Promise` 或异步 selector。如果 atom 在调用 `setSelf()` 之前被设置为一个值，那么它将被 `setSelf()` 覆盖。这种方法不仅限于 `await`，也适用于任何 `setSelf()` 的异步使用，例如 `setTimeout()`。

```jsx
const localForageEffect = key => ({setSelf, onSet}) => {
  /** 如果有一个持久化的值，在加载时设置它 */
  const loadPersisted = async () => {
    const savedValue = await localForage.getItem(key);

    if (savedValue != null) {
      setSelf(JSON.parse(savedValue));
    }
  };

  // 加载持久化的数据
  loadPersisted();

  onSet(newValue => {
    if (newValue instanceof DefaultValue) {
      localForage.removeItem(key);
    } else {
      localForage.setItem(key, JSON.stringify(newValue));
    }
  });
};

const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: 1,
  effects_UNSTABLE: [
    localForageEffect('current_user'),
  ]
});
```

## 向后兼容

如果你改变了 atom 的格式怎么办？用新的格式但是有基于旧格式的 `localStorage` 加载一个页面可能会导致问题。但是，你可以建立 effect 来处理恢复和验证值的类型安全方式：

```jsx
type PersistenceOptions<T>: {
  key: string,
  restorer: (mixed, DefaultValue) => T | DefaultValue,
};

const localStorageEffect = <T>(options: PersistenceOptions<T>) => ({setSelf, onSet}) => {
  const savedValue = localStorage.getItem(options.key)
  if (savedValue != null) {
    setSelf(options.restorer(JSON.parse(savedValue), new DefaultValue()));
  }

  onSet(newValue => {
    if (newValue instanceof DefaultValue) {
      localStorage.removeItem(options.key);
    } else {
      localStorage.setItem(options.key, JSON.stringify(newValue));
    }
  });
};

const currentUserIDState = atom<number>({
  key: 'CurrentUserID',
  default: 1,
  effects_UNSTABLE: [
    localStorageEffect({
      key: 'current_user',
      restorer: (value, defaultValue) =>
        // 值目前是以数字形式持续存在的
        typeof value === 'number'
          ? value
          // 如果数值以前是作为字符串保存的，则将其解析为一个数字
          : typeof value === 'string'
          ? parseInt(value, 10)
          // 如果值的类型不被识别，则使用 atom 的默认值。
          : defaultValue
    }),
  ],
});
```

如果用来保存数值的 key 发生变化怎么办？过去用一个 key 来持久化的东西现在用了几个 key；反之亦然？这也可以用一种类型安全的方式来处理：

```jsx
type PersistenceOptions<T>: {
  key: string,
  restorer: (mixed, DefaultValue, Map<string, mixed>) => T | DefaultValue,
};

const localStorageEffect = <T>(options: PersistenceOptions<T>) => ({setSelf, onSet}) => {
  const savedValues = parseValuesFromStorage(localStorage);
  const savedValue = savedValues.get(options.key);
  setSelf(
    options.restorer(savedValue ?? new DefaultValue(), new DefaultValue(), savedValues),
  );

  onSet(newValue => {
    if (newValue instanceof DefaultValue) {
      localStorage.removeItem(options.key);
    } else {
      localStorage.setItem(options.key, JSON.stringify(newValue));
    }
  });
};

const currentUserIDState = atom<number>({
  key: 'CurrentUserID',
  default: 1,
  effects_UNSTABLE: [
    localStorageEffect({
      key: 'current_user',
      restorer: (value, defaultValue, values) => {
        if (typeof value === 'number') {
          return value;
        }

        const oldValue = values.get('old_key');
        if (typeof oldValue === 'number') {
          return oldValue;
        }

        return defaultValue;
      },
    }),
  ],
});
```

## 浏览器 URL 历史的持久化

Atom effects 也可以持久化并与浏览器的 URL 历史同步。这对于让状态变化更新当前的 URL 是很有用的，因为这样就可以保存或与他人分享以恢复该状态。它还可以与浏览器历史记录整合，以利用浏览器的前进/后退按钮。*提供这种类型的持久性的例子或库即将推出……*。
