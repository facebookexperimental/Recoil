---
title: Motivação
---

Por razões de compatibilidade e simplicidade, é melhor usar os recursos integrados de gerenciamento de estado do React em vez do estado global externo. Mas o React tem certas limitações:

- O estado do componente só pode ser compartilhado empurrando-o para um elemento pai em comum, mas isso pode incluir uma árvore de elementos enorme que precisa ser renderizada novamente.
- O contexto só pode armazenar um único valor, não um conjunto indefinido de valores cada um com seus próprios consumidores.
- Ambos dificultam a divisão de código do topo da árvore (onde temos o estado) das folhas da árvore (onde o estado é usado).

Queremos melhorar isso enquanto mantemos a API, a semântica e o máximo de comportamento do React quanto possível.

Recoil define um gráfico em paralelo, mas também intrínseco à árvore de componentes do React. As mudanças de estado fluem das raízes deste gráfico (que chamamos de átomos) através de funções puras (que chamamos de seletores) e em componentes. Com esta abordagem:

- Obtemos uma API livre de clichês onde o estado compartilhado tem a mesma interface get/set simples que o estado local React  (ainda pode ser encapsulado com redutores etc. se necessário).
- Temos a possibilidade de compatibilidade com o Modo Simultâneo e outros novos recursos do React assim que estiverem disponíveis.
- A definição de estado é incremental e distribuída, tornando possível a divisão de código.
- O estado pode ser substituído por dados derivados sem modificar os componentes que os utilizam.
- Os dados derivados podem mover-se entre síncronos e assíncronos sem modificar os componentes que os utilizam.
- Podemos tratar a navegação como um conceito de primeira classe, até mesmo codificando transições de estado em links.
- É fácil persistir todo o estado do aplicativo de uma maneira que seja compatível com versões anteriores, portanto, os estados persistentes podem sobreviver às alterações do aplicativo.
