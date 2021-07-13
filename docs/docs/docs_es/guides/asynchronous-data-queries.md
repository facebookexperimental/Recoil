---
title: Consultas de Datos Asíncronos
sidebar_label: Consultas de Datos Asíncronos
---

Recoil proporciona una forma de mapear el estado y estados derivados con componentes de React a través de un grafo de flujo de datos. Lo que es realmente poderoso es que las funciones en el grafo también pueden ser asíncronas. Esto facilita el uso de funciones asíncronas en la función síncrona del render de los componentes de React. Recoil permite combinar funciones síncronas y asíncronas fácilmente en el flujo de datos de los selectores. Simplemente devuelve una Promise en la función callback `get` del selector, la interfaz permanece exactamente igual. Desde que son solo selectores, otros selectores también pueden depender de ellos para transformar aun más los datos.

## Ejemplo Síncrono

Por ejemplo, aquí hay simplemente un átomo y un selector sincronos que obtienen el nombre de un usuario:

```js
const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: 1,
});

const currentUserNameState = selector({
  key: 'CurrentUserName',
  get: ({get}) => {
    return tableOfUsers[get(currentUserIDState)].name;
  },
});

function CurrentUserInfo() {
  const userName = useRecoilValue(currentUserNameState);
  return <div>{userName}</div>;
}

function MyApp() {
  return (
    <RecoilRoot>
      <CurrentUserInfo />
    </RecoilRoot>
  );
}
```

## Ejemplo Asíncrono

Si los nombres de usuario estuvieran guardados en alguna base de datos tendríamos que consultarla, lo único que tenemos que hacer es devolver un `Promise` o usar una función con 'async'. Si alguna de las dependencias cambia, el selector será reevaluado y ejecutara una nueva consulta. Y será ejecutada una sola vez por cada entrada única porque el resultado es guardado en caché.

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

function CurrentUserInfo() {
  const userName = useRecoilValue(currentUserNameQuery);
  return <div>{userName}</div>;
}
```

La interfaz del selector es la misma, de este manera el componente que lo utiliza no necesita saber si es un estado de átomo síncrono, estado derivado o una consulta asíncrona.

Si React funciona de manera sincrónica ¿Qué despliega mientras una promise termina? Recoil esta diseñado para trabajar con React Suspense y datos pendientes. Al envolver los componentes con un límite de Suspense, se puede capturar los descendientes que están aun pendientes y desplegar una UI alternativa.

```js
function MyApp() {
  return (
    <RecoilRoot>
      <React.Suspense fallback={<div>Loading...</div>}>
        <CurrentUserInfo />
      </React.Suspense>
    </RecoilRoot>
  );
}
```

## Manejo de Errores

¿Qué pasa si la consulta tiene un error? Los selectores en Recoil también pueden arrojar errores, que posteriormente pueden ser detectados con `<ErrorBoundary>` de React. Por ejemplo:

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

function CurrentUserInfo() {
  const userName = useRecoilValue(currentUserNameQuery);
  return <div>{userName}</div>;
}

function MyApp() {
  return (
    <RecoilRoot>
      <ErrorBoundary>
        <React.Suspense fallback={<div>Loading...</div>}>
          <CurrentUserInfo />
        </React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
```

## Consultas con Parámetros

A veces es necesario ejecutar consultas con parámetros que no solo dependen del estado derivado. Por ejemplo, consultas basadas en los props del componente. Esto se puede lograr usando la función auxiliar `selectorFamily`.


```js
const userNameQuery = selectorFamily({
  key: 'UserName',
  get: (userID) => async ({get}) => {
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
    <RecoilRoot>
      <ErrorBoundary>
        <React.Suspense fallback={<div>Loading...</div>}>
          <UserInfo userID={1}/>
          <UserInfo userID={2}/>
          <UserInfo userID={3}/>
        </React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
```

## Grafo de Flujo de Datos

Recuerda, al configurar las consultas como selectores, podemos construir un grafo de flujo de datos combinando estados, estados derivados y consultas! Y a medida que el estado es actualizado, el grafo es actualizado automáticamente y renderiza los componentes de React.

```js
const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: 1,
});

const userInfoQuery = selectorFamily({
  key: 'UserInfoQuery',
  get: userID => async ({get}) => {
    const response = await myDBQuery({userID});
    if (response.error) {
      throw response.error;
    }
    return response;
  },
});

const currentUserInfoQuery = selector({
  key: 'CurrentUserInfoQuery',
  get: ({get}) => get(userInfoQuery(get(currentUserIDState)),
});

const friendsInfoQuery = selector({
  key: 'FriendsInfoQuery',
  get: userID => ({get}) => {
    const {friendList} = get(currentUserInfoQuery);
    const friends = [];
    for (const friendID of friendList) {
      const friendInfo = get(userInfoQuery(friendID));
      friends.push(friendInfo);
    }
    return friends;
  },
});

function CurrentUserInfo() {
  const currentUser = useRecoilValue(currentUserInfoQuery);
  const friends = useRecoilValue(friendsInfoQuery);
  const setCurrentUserID = useSetRecoilState(currentUserIDState);
  return (
    <div>
      <h1>{currentUser.name}</h1>
      <ul>
        {friends.map(friend =>
          <li key={friend.id} onClick={() => setCurrentUserID(friend.id)}>
            {friend.name}
          </li>
        )}
      </ul>
    </div>
  );
}

function MyApp() {
  return (
    <RecoilRoot>
      <ErrorBoundary>
        <React.Suspense fallback={<div>Loading...</div>}>
          <CurrentUserInfo />
        </React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
```

## Peticiones Concurrentes

Si notas en el ejemplo anterior, el `friendsInfoQuery` utiliza una consulta para obtener la información de cada amigo. Al hacer esto en un bucle, estas son básicamente ejecutas en serie. Todo está bien si las búsquedas son rápidas. Pero si son lentas, puedes utilizar concurrencia auxiliar como `waitForAll`, `waitForNone` o `waitForAny` para ejecutarlas en paralelo. Aceptan tanto arrays como objetos con nombres de dependencias.

```js
const friendsInfoQuery = selector({
  key: 'FriendsInfoQuery',
  get: userID => ({get}) => {
    const {friendList} = get(currentUserInfoQuery);
    const friends = get(waitForAll(
      friendList.map(friendID => userInfoQuery(friendID))
    ));
    return friends;
  },
});
```

## Sin React Suspense

No es necesario utilizar React Suspense con selectores asíncronos. También puedes utilizar el hook `useRecoilValueLoadable()` para determinar la situación de los datos pendientes durante el renderizado:

```js
function UserInfo({userID}) {
  const userNameLoadable = useRecoilValueLoadable(userNameQuery(userID));
  switch (userNameLoadable.status) {
    case 'hasValue':
      return <div>{userNameLoadable.contents}</div>;
    case 'loading':
      return <div>Loading...</div>;
    case 'hasError':
      throw userNameLoadable.contents;
  }
}
```
