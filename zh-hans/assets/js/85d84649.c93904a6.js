"use strict";(self.webpackChunkrecoil=self.webpackChunkrecoil||[]).push([[4047],{3905:function(e,t,n){n.d(t,{Zo:function(){return u},kt:function(){return m}});var r=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var c=r.createContext({}),s=function(e){var t=r.useContext(c),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},u=function(e){var t=s(e.components);return r.createElement(c.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,o=e.originalType,c=e.parentName,u=l(e,["components","mdxType","originalType","parentName"]),d=s(n),m=a,y=d["".concat(c,".").concat(m)]||d[m]||p[m]||o;return n?r.createElement(y,i(i({ref:t},u),{},{components:n})):r.createElement(y,i({ref:t},u))}));function m(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=n.length,i=new Array(o);i[0]=d;var l={};for(var c in t)hasOwnProperty.call(t,c)&&(l[c]=t[c]);l.originalType=e,l.mdxType="string"==typeof e?e:a,i[1]=l;for(var s=2;s<o;s++)i[s]=n[s];return r.createElement.apply(null,i)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},7254:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return l},contentTitle:function(){return c},metadata:function(){return s},toc:function(){return u},default:function(){return d}});var r=n(7462),a=n(3366),o=(n(7294),n(3905)),i=["components"],l={title:"Recoil and GraphQL with Relay",sidebar_label:"Introduction"},c=void 0,s={unversionedId:"recoil-relay/introduction",id:"recoil-relay/introduction",title:"Recoil and GraphQL with Relay",description:"---",source:"@site/docs/recoil-relay/introduction.md",sourceDirName:"recoil-relay",slug:"/recoil-relay/introduction",permalink:"/zh-hans/docs/recoil-relay/introduction",editUrl:"https://github.com/facebookexperimental/Recoil/edit/docs/docs/i18n/zh-hans/docusaurus-plugin-content-docs/current/recoil-relay/introduction.md",tags:[],version:"current",frontMatter:{title:"Recoil and GraphQL with Relay",sidebar_label:"Introduction"},sidebar:"recoil-relay",next:{title:"Relay Environment",permalink:"/zh-hans/docs/recoil-relay/environment"}},u=[{value:"Example",id:"example",children:[],level:2},{value:"Installation",id:"installation",children:[],level:2}],p={toc:u};function d(e){var t=e.components,n=(0,a.Z)(e,i);return(0,o.kt)("wrapper",(0,r.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("hr",null),(0,o.kt)("blockquote",null,(0,o.kt)("h2",{parentName:"blockquote",id:"\ufe0f-preview-documentation-\ufe0f"},"\u2757\ufe0f ",(0,o.kt)("em",{parentName:"h2"},"Preview Documentation")," \u2757\ufe0f"),(0,o.kt)("p",{parentName:"blockquote"},(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("em",{parentName:"strong"},"This is preview documentation for the recoil-relay library before it is released.")),(0,o.kt)("br",null))),(0,o.kt)("hr",null),(0,o.kt)("p",null,"The ",(0,o.kt)("inlineCode",{parentName:"p"},"recoil-relay")," library helps Recoil perform type safe and efficient queries using ",(0,o.kt)("a",{parentName:"p",href:"https://graphql.org/"},"GraphQL")," with the ",(0,o.kt)("a",{parentName:"p",href:"https://relay.dev"},"Relay")," library.  It provides selectors which can easily query with GraphQL.  The queries are synced with the Recoil data-flow graph so downstream selectors can derive state from them, they can depend on upstream Recoil state, and they are automatically subscribed to any changes in the graph from Relay.  Everything stays in sync automatically."),(0,o.kt)("h2",{id:"example"},"Example"),(0,o.kt)("p",null,"After setting up your Relay environment adding a GraphQL query is as simple as defining a ",(0,o.kt)("a",{parentName:"p",href:"/docs/recoil-relay/graphql-selectors"},"GraphQL selector"),"."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-jsx"},"const userNameQuery = graphQLSelector({\n  key: 'UserName',\n  environment: myEnvironment,\n  query: graphql`\n    query UserQuery($id: ID!) {\n      user(id: $id) {\n        name\n      }\n    }\n  `,\n  variables: ({get}) => ({id: get(currentIDAtom)}),\n  mapResponse: data => data.user?.name,\n});\n")),(0,o.kt)("p",null,"Then use it like any other Recoil ",(0,o.kt)("a",{parentName:"p",href:"/docs/api-reference/core/selector"},"selector"),":"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-jsx"},"function MyComponent() {\n  const userName = useRecoilValue(userNameQuery);\n  return <span>{userName}</span>;\n}\n")),(0,o.kt)("h2",{id:"installation"},"Installation"),(0,o.kt)("p",null,"Please see the ",(0,o.kt)("a",{parentName:"p",href:"/docs/introduction/installation"},"Recoil installation guide")," for installing Recoil and the ",(0,o.kt)("a",{parentName:"p",href:"https://relay.dev/docs/getting-started/installation-and-setup/"},"Relay documentation")," for installing and setting up the Relay library, GraphQL compiler, Babel plugin, and ESLint plugin.  Then add ",(0,o.kt)("inlineCode",{parentName:"p"},"recoil-relay")," as a dependency."))}d.isMDXComponent=!0}}]);