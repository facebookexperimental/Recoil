---
title: Requêtes de données asynchrones
sidebar_label: Requêtes asynchrones
---

Recoil fournit un moyen de mapper état et état dérivé aux composants React via un graphe de flux de données. Ce qui est vraiment puissant, c'est que les fonctions du graphe peuvent également être asynchrones. Cela facilite l'utilisation de fonctions asynchrones au sein de fonctions synchrones de composants React. Recoil vous permet de mélanger de manière transparente des fonctions synchrones et asynchrones dans votre graphe de flux de données de sélecteurs. Renvoyez simplement une promesse de valeur au lieu de la valeur elle-même à partir d'un rappel de sélecteur `get`, l'interface reste exactement la même. Comme ce ne sont que des sélecteurs, d'autres sélecteurs peuvent également en dépendre pour transformer davantage les données.

Les sélecteurs peuvent être utilisés comme un moyen d'incorporer des données asynchrones dans le graphe de flux de données Recoil. Veuillez garder à l'esprit que les sélecteurs représentent des fonctions "idempotentes": pour un ensemble donné d'entrées, ils doivent toujours produire les mêmes résultats (au moins pour la durée de vie de l'application). Ceci est important car les résultats de l'évaluations de ces sélecteurs peuvent être mises en cache, redémarrées ou exécutées plusieurs fois. Pour cette raison, les sélecteurs sont généralement un bon moyen de modéliser des requêtes de base de données en lecture seule. Pour les données mutables, vous pouvez utiliser une [Query Refresh](#query-refresh) (Actualisation de requête) ou pour synchroniser un état mutable, un état persistant ou pour d'autres effets secondaires, pensez à l'API expérimentale pour [Effets Atomiques](/docs/guides/atom-effects).

## Exemple synchrone

Par exemple, voici un simple synchrone [atome](/docs/api-reference/core/atom) et [sélecteur](/docs/api-reference/core/selector) pour obtenir un nom d'utilisateur:

```jsx
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

function MonApplication() {
  return (
    <RecoilRoot>
      <CurrentUserInfo />
    </RecoilRoot>
  );
}
```

## Exemple asynchrone

Si les noms d'utilisateur ont été stockés dans une base de données que nous devons interroger, tout ce que nous devons faire est de retourner une `Promise` ou d'utiliser une fonction` async`. Si des dépendances changent, le sélecteur sera réévalué et exécutera une nouvelle requête. Les résultats sont mis en cache, de sorte que la requête ne s'exécutera qu'une seule fois par entrée unique.

```jsx
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

L'interface du sélecteur est la même, donc le composant utilisant ce sélecteur n'a pas besoin de se soucier si la value provient d'un état d'atome synchrone, d'un état de sélecteur dérivé ou de requêtes asynchrones!

Mais, puisque les fonctions de rendu de React sont synchrones, que rendront-t-elles avant la résolution de la promesse? Recoil est conçu pour fonctionner avec [React Suspense](https://reactjs.org/docs/concurrent-mode-suspense.html) pour gérer les données en attente. Envelopper votre composant avec une limite `Suspense` interceptera tous les descendants qui sont toujours en attente et rendra une interface utilisateur de secours:

```jsx
function MonApplication() {
  return (
    <RecoilRoot>
      <React.Suspense fallback={<div>Chargement...</div>}>
        <CurrentUserInfo />
      </React.Suspense>
    </RecoilRoot>
  );
}
```

## La gestion d'erreurs

Mais que faire si la demande à échouée ou contient une erreur? Les sélecteurs Recoil peuvent également générer des erreurs qui seront ensuite lancées si un composant tente d'utiliser cette valeur. Cela peut être intercepté avec un React [`<ErrorBoundary>`](https://reactjs.org/docs/error-boundaries.html). Par exemple:

```jsx
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

function MonApplication() {
  return (
    <RecoilRoot>
      <ErrorBoundary>
        <React.Suspense fallback={<div>Chargement...</div>}>
          <CurrentUserInfo />
        </React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
```

## Requêtes avec paramètres

Parfois, vous souhaitez pouvoir interroger en fonction de paramètres qui ne sont pas uniquement basés sur un état dérivé. Par exemple, vous souhaiterez peut-être effectuer une requête en fonction des "props" du composant. Vous pouvez le faire en utilisant l'assistant [**`selectorFamily`**](/docs/api-reference/utils/selectorFamily):

```jsx
const userNameQuery = selectorFamily({
  key: 'UserName',
  get: userID => async () => {
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

## Graphe de flux de données

N'oubliez pas qu'en modélisant les requêtes en tant que sélecteurs, nous pouvons créer un graphe de flux de données mélangeant l'état, l'état dérivé et les requêtes! Ce graphe se mettra à jour et re-rendra automatiquement les composants React à mesure que l'état est changé.

L'exemple suivant rendra le nom de l'utilisateur actuel et une liste de ses amis. Si vous cliquez sur le nom d'un ami, il deviendra l'utilisateur actuel et le nom et la liste seront automatiquement mis à jour.

```jsx
const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: null,
});

const userInfoQuery = selectorFamily({
  key: 'UserInfoQuery',
  get: userID => async () => {
    const response = await myDBQuery({userID});
    if (response.error) {
      throw response.error;
    }
    return response;
  },
});

const currentUserInfoQuery = selector({
  key: 'CurrentUserInfoQuery',
  get: ({get}) => get(userInfoQuery(get(currentUserIDState))),
});

const friendsInfoQuery = selector({
  key: 'FriendsInfoQuery',
  get: ({get}) => {
    const {friendList} = get(currentUserInfoQuery);
    return friendList.map(friendID => get(userInfoQuery(friendID)));
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

function MonApplication() {
  return (
    <RecoilRoot>
      <ErrorBoundary>
        <React.Suspense fallback={<div>Chargement...</div>}>
          <CurrentUserInfo />
        </React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
```

## Requêtes concomitantes

Si vous remarquez dans l'exemple ci-dessus, `friendsInfoQuery` utilise une requête pour obtenir les informations de chaque ami. Mais, en faisant cela dans une boucle, les requêtes seront exécutées séquentiellement. Si la recherche est rapide, cela peut être acceptable. Si le coût est cher, vous pouvez utiliser un assistant d'accès concurrentiel tel que [`waitForAll`](/docs/api-reference/utils/waitForAll) pour les exécuter en parallèle. Cet assistant accepte à la fois des tableaux et des objets nommés de dépendances.

```jsx
const friendsInfoQuery = selector({
  key: 'FriendsInfoQuery',
  get: ({get}) => {
    const {friendList} = get(currentUserInfoQuery);
    const friends = get(waitForAll(
      friendList.map(friendID => userInfoQuery(friendID))
    ));
    return friends;
  },
});
```

Vous pouvez utiliser [`waitForNone`](/docs/api-reference/utils/waitForNone) pour gérer les mises à jour incrémentielles de l'interface utilisateur avec des données partielles

```jsx
const friendsInfoQuery = selector({
  key: 'FriendsInfoQuery',
  get: ({get}) => {
    const {friendList} = get(currentUserInfoQuery);
    const friendLoadables = get(waitForNone(
      friendList.map(friendID => userInfoQuery(friendID))
    ));
    return friendLoadables
      .filter(({state}) => state === 'hasValue')
      .map(({contents}) => contents);
  },
});
```

## Prélecture

Pour des raisons de performances, vous souhaitez peut-être lancer la récupération *avant* le rendu. De cette façon, la requête peut continuer pendant que le rendu commence. La [Documentation de React](https://reactjs.org/docs/concurrent-mode-suspense.html#start-fetching-early) donnent quelques exemples. Ce modèle fonctionne également avec Recoil.

Modifions l'exemple ci-dessus pour lancer une récupération des informations sur l'utilisateur suivant dès que l'utilisateur clique sur le bouton pour changer d'utilisateur:

```jsx
function CurrentUserInfo() {
  const currentUser = useRecoilValue(currentUserInfoQuery);
  const friends = useRecoilValue(friendsInfoQuery);

  const changeUser = useRecoilCallback(({snapshot, set}) => userID => {
    snapshot.getLoadable(userInfoQuery(userID)); // prélit les informations utilisateur
    set(currentUserIDState, userID); // change l'utilisateur courant pour commancer un nouveau rendu
  });

  return (
    <div>
      <h1>{currentUser.name}</h1>
      <ul>
        {friends.map(friend =>
          <li key={friend.id} onClick={() => changeUser(friend.id)}>
            {friend.name}
          </li>
        )}
      </ul>
    </div>
  );
}
```

## Requêter les valeurs par défaut de atomes 

Un modèle courant consiste à utiliser un atome pour représenter un état modifiable local, mais à utiliser un sélecteur pour interroger les valeurs par défaut:

```jsx
const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: selector({
    key: 'CurrentUserID/Default',
    get: () => myFetchCurrentUserID(),
  }),
});
```

Si vous souhaitez une synchronisation bidirectionnelle des données, considérez les [`Effets Atomiques`](/docs/guides/atom-effects)

## Requêtes asynchrones sans React Suspense

Il n'est pas nécessaire d'utiliser React Suspense pour gérer les sélecteurs asynchrones en attente. Vous pouvez également utiliser le hook [`useRecoilValueLoadable()`](/docs/api-reference/core/useRecoilValueLoadable) pour déterminer l'état pendant le rendu:

```jsx
function UserInfo({userID}) {
  const userNameLoadable = useRecoilValueLoadable(userNameQuery(userID));
  switch (userNameLoadable.state) {
    case 'hasValue':
      return <div>{userNameLoadable.contents}</div>;
    case 'loading':
      return <div>Chargement...</div>;
    case 'hasError':
      throw userNameLoadable.contents;
  }
}
```

## Actualisation de requête

Lorsque vous utilisez des sélecteurs pour modéliser des requêtes de données, il est important de se rappeler que l'évaluation des sélecteurs doit toujours fournir un résultat constante pour un état donné. Les sélecteurs représentent l'état dérivé d'autres états d'atomes et de sélecteurs. Ainsi, les fonctions d'évaluation des sélecteurs doivent être idempotentes pour une entrée donnée, car elles peuvent être mises en cache ou exécutées plusieurs fois. En pratique, cela signifie qu'un seul sélecteur ne doit pas être utilisé pour une requête dont vous vous attendez à ce que les résultats varient pendant la durée de vie de l'application.

Il existe quelques modèles que vous pouvez utiliser pour travailler avec des données mutables:

### Utiliser des requêtes identifiable
L'évaluation du sélecteur doit fournir un résultat constant pour un état donné en entrée (état dépendant ou paramètres de famille). Ainsi, vous pouvez ajouter un identifiant de demande en tant que paramètre de famille ou en tant que dépendance à votre requête. Par exemple:

```jsx
const userInfoQueryRequestIDState = atomFamily({
  key: 'UserInfoQueryRequestID',
  default: 0,
});

const userInfoQuery = selectorFamily({
  key: 'UserInfoQuery',
  get: userID => async ({get}) => {
    get(userInfoQueryRequestIDState(userID)); // Ajouter un identifiant de requête en tant que dépendence
    const response = await myDBQuery({userID});
    if (response.error) {
      throw response.error;
    }
    return response;
  },
});

function useRefreshUserInfo(userID) {
  const setUserInfoQueryRequestID = useSetRecoilState(userInfoQueryRequestIDState(userID));
  return () => {
    setUserInfoQueryRequestID(requestID => requestID + 1);
  };
}

function CurrentUserInfo() {
  const currentUserID = useRecoilValue(currentUserIDState);
  const currentUserInfo = useRecoilValue(userInfoQuery(currentUserID));
  const refreshUserInfo = useRefreshUserInfo(currentUserID);

  return (
    <div>
      <h1>{currentUser.name}</h1>
      <button onClick={refreshUserInfo}>Rafraîchir</button>
    </div>
  );
}
```

### Utiliser un atome
Une autre option consiste à utiliser un atome, au lieu d'un sélecteur, pour modéliser les résultats de la requête. Vous pouvez mettre à jour impérativement  l'état de l'atome avec les nouveaux résultats de la requête en fonction de votre stratégie d'actualisation.

```jsx
const userInfoState = atomFamily({
  key: 'UserInfo',
  default: userID => fetch(userInfoURL(userID)),
});

// React component to refresh query
function RefreshUserInfo({userID}) {
  const refreshUserInfo = useRecoilCallback(({set}) => async id => {
    const userInfo = await myDBQuery({userID});
    set(userInfoState(userID), userInfo);
  }, [userID]);

  // Refresh user info every second
  useEffect(() => {
    const intervalID = setInterval(refreshUserInfo, 1000);
    return () => clearInterval(intervalID);
  }, [refreshUserInfo]);

  return null;
}
```

Un inconvénient de cette approche est que les atomes ne supportent pas *pour l'instant* l'acceptation d'une `Promise` comme nouvelle valeur afin de profiter automatiquement de React Suspense pendant que l'actualisation de la requête est en attente, si tel est le comportement souhaité. Cependant, vous pouvez stocker un objet qui encode manuellement l'état de chargement ainsi que les résultats si vous le souhaitez.

Tenez également compte des [Effets Atomiques](/docs/guides/atom-effects) pour la synchronisation des requêtes d'atomes.
