---
title: 用于同步 atom 的 effect - syncEffect()
sidebar_label: 开始同步 atom
---

[`syncEffect()`](/docs/recoil-sync/api/syncEffect) 实质是一个 [atom effect](/docs/guides/atom-effects)， 用于标记应该同步的 atom 并使用外部 store 初始化。 唯一必填的选项是用于验证输入数据的 `refine`。 可选的 `itemKey` 选项允许您为这个 atom 指定一个和外部数据项对应的"键"。 如果未指定，则默认使用 atom 的 `key`。 当有多个外部存储的情况下，还可以提供一个 `storeKey` 来匹配要同步的 store 。此外这里还有其他选项，例如用于更复杂情形的 `read` 和 `write`。

## 输入验证

为了验证来自外部系统的输入并将无类型数据改进为强类型的 Flow 或 TypeScript 输入，`recoil-sync` 使用 [Refine](/docs/refine/introduction) 库。 该库使用一组可组合函数来描述类型并执行运行时验证。 [`syncEffect()`](/docs/recoil-sync/api/syncEffect) 的 `refine` 属性使用了 [Refine 检查器](/docs/refine/api/Checkers)。 Refine 检查器的类型必须与 atom 的类型相匹配。

字符串类型 atom 示例：

```jsx
syncEffect({ refine: string() }),
```

可为null的数字类型的示例效果：

```jsx
syncEffect({ refine: nullable(number()) }),
```

用户自定义类型:

```jsx
syncEffect({ refine: custom(x => x instanceof MyClass ? x : null) }),
```

稍微复杂点的例子:

```jsx
syncEffect({ refine: object({
  id: number(),
  friends: array(number()),
  positions: dict(tuple(bool(), number())),
})}),
```

更多细节可参考 [Refine 文档](/docs/refine/introduction).
## itemKey 和 storeKey

`itemKey` 选项用来指定在 Store 中的唯一标识，如果没有指定则默认为 `atom` 的 key。 如果使用了  [`read()`](/docs/recoil-sync/api/syncEffect#read-interface) 或 [`write()`](/docs/recoil-sync/api/syncEffect#write-interface) 那么这个 key 可以被 [改写升级](#upgrade-atom-key) 或 [ 使用多个key对应一个 atom](#多对一)。

`storeKey` 用来指定使用哪一个 `store` 进行同步，它和带有 `storeKey` 属性的 [`<RecoilSync>`](/docs/recoil-sync/api/RecoilURLSync) 应该一一对应。在[升级atom存储方式](#升级atom存储方式) 或存在 [多store](#syncing-with-multiple-storages) 的场景会很有用。

```jsx
atom({
  key: 'AtomKey',
  effects: [
    syncEffect({
      itemKey: 'myItem',
      storeKey: 'storeA',
      refine: string(),
    }),
  ],
});
```

### Atom Families

[atom family](/docs/api-reference/utils/atomFamily) 中的 atom 同样可以使用 [`syncEffect()`](/docs/recoil-sync/api/syncEffect) 进行同步。其中每个 atom 会被视作独立的 atom 地进行同步，默认的 `itemKey` 是序列化后的 family 参数。如果你指定了 `itemKey` 同样地需要你自己对 family 参数进行相关编码处理，来唯一标识每个 atom。参数可以通过 callback 形式的 `effects` 选项获取。

```jsx
atomFamily({
  key: 'AtomKey',
  effects: param => [
    syncEffect({
      itemKey: `myItem-${param}`,
      storeKey: 'storeA',
      refine: string(),
    }),
  ],
});
```

## 向下兼容能力

支持历史遗留系统或外部系统的前代版本同样很重要，这里提供了下面几种可用机制:

### 升级 atom 的数据类型

如果一个原子被持久化到一个 Store 并且你已经改变了 atom 的类型，你可以使用 Refine 的 [`match()`](/docs/refine/api/Advanced_Checkers#match) 和 [`asType()`](/docs/refine/api/Advanced_Checkers#asType) 升级类型。 下面的示例读取当前为数字但之前存储为字符串或对象的 ID。 它将升级以前的类型，atom 将始终存储最新的类型。

```jsx
const myAtom = atom<number>({
  key: 'MyAtom',
  default: 0,
  effects: [
    syncEffect({ refine: match(
      number(),
      asType(string(), x => parseInt(x)),
      asType(object({value: number()}), x => x.value)),
    }),
  ],
});
```

### 升级atom的key

atom 的 key 同样有可能更改，`read` 选项允许指定如何从外部 store 中读取 atom.

```jsx
const myAtom = atom<number>({
  key: 'MyAtom',
  default: 0,
  effects: [
    syncEffect({
      itemKey: 'new_key',
      read: ({read}) => read('new_key') ?? read('old_key'),
    }),
  ],
});
```

`read` 选项可以进行更复杂的转换，请参见下文。

### 升级atom存储方式

您还可以迁移 atom 以使用多种 `effect` 与新的外部存储同步。

```jsx
const myAtom = atom<number>({
  key: 'MyAtom',
  default: 0,
  effects: [
    syncEffect({ storeKey: 'old_store', refine: number() }),
    syncEffect({ storeKey: 'new_store', refine: number() }),
  ],
});
```

## 同步到多个存储系统中

一个 atom 与多个存储系统同步可能是可取的。 例如，某些 UI 状态的原子可能希望保留可共享 URL 的当前状态，同时还与存储在云中的每个用户默认值同步。 这可以简单地通过组合多个 effect 来完成（您可以使用 [`syncEffect()`](/docs/recoil-sync/api/syncEffect) 或其他effect进行混合和匹配）。 effect 按顺序执行，因此最后一个 effect 将有最高优先级来初始化 atom。

```jsx
const currentTabState = atom<string>({
  key: 'CurrentTab',
  default: 'FirstTab', // Fallback default for first-use
  effects: [
    // Initialize default with per-user default from the cloud
    syncEffect({ storeKey: 'user_defaults', refine: string() }),

    // Override with state stored in URL if reloading or sharing
    syncEffect({ storeKey: 'url', refine: string() }),
  ],
});
```

### 抽象 Store

根据主机环境，同一个 atom 也可能与不同的存储同步。 例如：

```jsx
const currentUserState = atom<number>({
  key: 'CurrentUser',
  default: 0,
  effects: [
    syncEffect({ storeKey: 'ui_state', refine: number() }),
  ],
});
```
一个独立的应用程序可能会将该 atom 与 URL 同步：

```jsx
function MyStandaloneApp() {
  return (
    <RecoilRoot>
      <RecoilURLSyncTransit storeKey="ui_state" location={{part: 'hash'}}>
        ...
      </RecoilURLSyncTransit>
    </RecoilRoot>
  );
}
```

而另一个使用使用相同 atom 的组件的应用程序可能希望将其与本地存储同步：

```jsx
function AnotherApp() {
  return (
    <RecoilRoot>
      <RecoilSyncLocalStorage storeKey="ui_state">
        ...
      </RecoilSyncLocalStorage>
    </RecoilRoot>
  )
}
```

## 高级 Atom 映射

atom 可能不会一对一地映射到外部存储中的数据项。 [此示例](/docs/recoil-sync/sync-effect#升级atom的key) 描述了使用 `read` 实现 key 升级。 [`syncEffect()`](/docs/recoil-sync/api/syncEffect) 的 `read` 和 `write` 选项可用于实现更复杂的映射。

必须小心高级映射，因为可能存在顺序问题，或覆盖相同的数据项等。


### 多对一

从多个外部数据项中提取状态的 atom 的示例效果：

```jsx
function manyToOneSyncEffect() {
  syncEffect({
    refine: object({ foo: nullable(number()), bar: nullable(number()) }),
    read: ({read}) => ({foo: read('foo'), bar: read('bar')}),
    write: ({write, reset}, newValue) => {
      if (newValue instanceof DefaultValue) {
        reset('foo');
        reset('bar');
      } else {
        write('foo', newValue.foo);
        write('bar', newValue.bar);
      }
    },
  });
}

atom<{foo: number, bar: number}>({
  key: 'MyObject',
  default: {},
  effects: [manyToOneSyncEffect()],
});
```

### 一对多

从外部的复合对象中提取部分状态的示例效果：

```jsx
function oneToManySyncEffect(prop: string) {
  const validate = assertion(dict(nullable(number())));
  syncEffect({
    refine: nullable(number()),
    read: ({read}) => validate(read('compound'))[prop],
    write: ({write, read}, newValue) => {
      const compound = {...validate(read('compound'))};
      if (newValue instanceof DefaultValue) {
        delete compound[prop];
        write('compound', compound);
      } else {
        write('compound', {...compound, [prop]: newValue});
      }
    },
  });
}

atom<number>({
  key: 'MyNumber',
  default: 0,
  effects: [oneToManySyncEffect('foo')],
});
```
