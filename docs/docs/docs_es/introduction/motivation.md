---
title: Motivación
---

Por razones de compatibilidad y simplicidad, es mejor usar las funciones nativas de React para el manejo de estados, en lugar de utilizar estados externos y globales. Pero React tiene algunas limitaciones:

- El estado de un componente solo se puede puede compartir al subirlo al componente padre común, pero esto implica tener un árbol de componentes más grande que re-renderizar.
- El contexto de React solo puede mantener un valor, y no un conjunto indefinido de valores con sus respectivos consumidores.
- Por estas dos razones, es difícil dividir el código de la parte más alta del árbol de componentes (donde tenemos el estado) de las hojas del mismo árbol (donde el estado es usado).

Queremos mejorar esto y al mismo tiempo mantener la misma API, y tanto comportamiento de React como sea posible.

Recoil mantiene paralelamente un grafo, pero también intrínseco a tu árbol de componentes de React. Los cambios de estado fluyen desde las raíces de este grafo (que llamamos átomos), pasan a través de funciones puras (que hemos llamado selectores), y finalmente llegan hasta los componentes.
Con este enfoque:

- Crear una API libre de código repetitivo, donde el estado a compartir pueda utilizar la misma interfaz get/set, igual que el estado interno de React (Aunque también se puede encapsular con reductores si fuese necesario).
- Tenemos la posibilidad de ser compatibles con el Modo Concurrente y cualquier otra funcionalidad nueva de React.
- El estado es definido incremental y distribuidamente permitiendo así dividir el código.
- El estado puede ser reemplazado con datos derivados sin tener que modificar el componente que lo usa.
- Los datos derivados pueden ser cambiados asíncronos o síncronos (y viceversa), sin tener que modificar el componente suscrito.
- Podemos usar la navegación como fuente primaria, incluso codificar el estado en hipervínculos.
- Es fácil mantener todo el estado de la aplicación persistentemente y compatible con versiones anteriores, por lo que puede sobrevivir cambios en la aplicación.
