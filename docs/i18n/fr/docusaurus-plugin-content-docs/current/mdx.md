---
id: mdx
title: Propulsé par MDX
---

Vous pouvez écrire du JSX et utiliser des composants React dans votre Markdown grace à [MDX](https://mdxjs.com/).

export const Highlight = ({children, color}) => ( <span style={{
      backgroundColor: color,
      borderRadius: '2px',
      color: '#fff',
      padding: '0.2rem',
    }}> {children} </span> );

<Highlight color="#25c2a0">Vert Docusaurus</Highlight> et <Highlight color="#1877F2">blue Facebook</Highlight> sont mes couleures favorites.

Je peux utiliser du **Markdown** dans mon _JSX_!
