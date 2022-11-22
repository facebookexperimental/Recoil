---
title: Motivation
---

Pour des raisons de compatibilité et de simplicité, il est préférable d'utiliser les capacités de gestion d'état intégrées de React plutôt qu'un solution d'état global externe. Mais React a certaines limites:

- L'état des composants ne peut être partagé qu'en étant poussant vers un ancêtre commun, mais cela peut inclure un arbre de taille conséquente qui doit ensuite être re-rendu.
- Le contexte ne peut stocker qu'une valeur seule, pas un jeu indéfini de valeures avec chacune leur propre composant consommateurs.
- Ces deux éléments rendent difficile la fragmentation de code du haut de l'arbre (où l'état doit vivre) vers les feuilles de l'arbre (où l'état est utilisé).

Nous voulons améliorer cela tout en gardant l'API et la sémantique ainsi qu'un comportement aussi _React_ que possible.

Recoil définit un graphe orienté orthogonal mais également intrinsèque et attaché à votre arbre React. Les changements d'état découlent des racines de ce graphe (que nous appelons des atomes) à travers des fonctions pures (que nous appelons des sélecteurs) et enfin vers les composants. Avec cette approche:

- Nous obtenons une API sans code squelette où l'état partagé a la même interface get / set simple que l'état local React (mais peut être encapsulé avec des réducteurs, etc. si nécessaire).
- Nous avons la possibilité de compatibilité avec le mode concurrent et d'autres nouvelles fonctionnalités de React dès qu'elles seront disponibles.
- La définition de l'état est incrémentielle et distribuée, ce qui rend possible la fragmentation de code.
- L'état peut être remplacé par des données dérivées sans modifier les composants qui l'utilisent.
- Les données dérivées peuvent passer de synchrones à asynchrones sans modifier les composants qui les utilisent.
- Nous pouvons traiter la navigation comme un concept de première classe, même en codant les transitions d'état dans les liens.
- Il est facile de conserver l'intégralité de l'état de l'application d'une manière rétrocompatible, de sorte que les états persistants puissent survivre les modifications apportées à l'application.
