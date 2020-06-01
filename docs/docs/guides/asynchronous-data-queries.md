---
title: Asynchronous Data Queries
sidebar_label: Asynchronous Data Queries
---

Recoil provides a way to map state and derived state to React components via a data flow graph.  What's really powerful is that the functions in the graph can also be asynchronous.  This makes it easy to use asynchronous functions in synchronous React component render functions.  Recoil allows you to seemlessly mix synchronous and asynchronous functions in your data flow graph of selectors.  Simply return a Promise to a value instead of the value itself from a selector `get` callback, the interface remains exactly the same.  Because these are just selectors, other selectors can also depend on them to further transform the data.

## Synchronous Example
For example, here is a simple synchronous atom and selector to get a user name:

```js
const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: 0,
});

const currentUserNameState = selector({
  key: 'CurrentUserName',
  get: ({get}) => {
    return tableOfUsers[get(currentUserIDState)].name;
  },
});

function UserInfo() {
  const userName = useRecoilValue(currentUserNameState);
  return <div>{userName}</div>;
}

function MyApp() {
  return (
    <div>
      <UserInfo />
    </div>
  );
}
```

## Asynchronous Example

If the user names were stored on some database we need to query, all we need to do is return a `Promise` or use an `async` function.  If any dependencies change, the selector will be re-evaluated and execute a new query.  The results are cached, so the query will only execute once per unique input.

```js
const currentUserNameQuery = selector({
  key: 'CurrentUserName',
  get: async ({get}) => {
    const response = await myDBQuery({
      userID: get(currentUserIDState),
    });
    return response.name;
  },
});

function UserInfo() {
  const userName = useRecoilValue(currentUserNameQuery);
  return <div>{userName}</div>;
}
```

The interface of the selector is the same, so the component using this selector doesn't need to care if it was backed with synchronous atom state, derived selector state, or asynchronous queries!

But, since React is synchronous, what will it render before the promise resolves?  Recoil is designed to work with React Suspense to handle pending data.  Wrapping your component with a Suspense boundary will catch any descendents that are still pending and render a fallback UI:

```js
function MyApp() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <UserInfo />
    </React.Suspense>
  );
}
```

## Error Handling

But what if the request has an error?  Recoil selectors can also throw errors which will then be thrown if a component tries to use that value.  This can be caught with a React `<ErrorBoundary>`.  For example:
```js
const currentUserNameQuery = selector({
  key: 'CurrentUserName',
  get: async ({get}) => {
    const response = await myDBQuery({
      userID: get(currentUserIDState),
    });
    if (response.error) {
      throw response.error;
    }
    return response.name;
  },
});

function UserInfo() {
  const userName = useRecoilValue(currentUserNameQuery);
  return <div>{userName}</div>;
}

function MyApp() {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div>Loading...</div>}>
        <UserInfo />
      </React.Suspense>
    </ErrorBoundary>
  );
}
```

## Queries with Parameters
Sometimes you want to be able to query based on parameters that aren't just based on derived state.  For example, you may want to query based on the component props.  You can do that using the `atomFamily` helper:
```js
const userNameQuery = atomFamily({
  key: 'UserName',
  default: async userID => {
    const response = await myDBQuery({userID});
    if (response.error) {
      throw response.error;
    }
    return response.name;
  },
});

function UserInfo({userID}) {
  const userName = useRecoilValue(userNameQuery(userID));
  return <div>{userName}</div>;
}

function MyApp() {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div>Loading...</div>}>
        <UserInfo userID={1}/>
        <UserInfo userID={2}/>
        <UserInfo userID={3}/>
      </React.Suspense>
    </ErrorBoundary>
  );
}
```

## Without React Suspense
It is not necessary to use React Suspense for handling pending asynchronous selectors.  You can also use the `useRecoilValueLoadable()` hook to determine the status during rendering:

```js
function UserInfo({userID}) {
  const userNameLoadable = useRecoilValueLoadable(userNameQuery(userID));
  switch(userNameLoadable.status) {
    case 'hasValue':
      return <div>{userNameLoadable.contents}</div>;
    case 'loading':
      return <div>Loading...</div>;
    case 'hasError':
      throw userNameLoadable.contents;
  }
}
```
