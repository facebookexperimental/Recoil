"use strict";(self.webpackChunkrecoil=self.webpackChunkrecoil||[]).push([[3265],{3905:function(e,t,n){n.d(t,{Zo:function(){return p},kt:function(){return d}});var r=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var c=r.createContext({}),l=function(e){var t=r.useContext(c),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},p=function(e){var t=l(e.components);return r.createElement(c.Provider,{value:t},e.children)},m={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},u=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,o=e.originalType,c=e.parentName,p=s(e,["components","mdxType","originalType","parentName"]),u=l(n),d=a,f=u["".concat(c,".").concat(d)]||u[d]||m[d]||o;return n?r.createElement(f,i(i({ref:t},p),{},{components:n})):r.createElement(f,i({ref:t},p))}));function d(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=n.length,i=new Array(o);i[0]=u;var s={};for(var c in t)hasOwnProperty.call(t,c)&&(s[c]=t[c]);s.originalType=e,s.mdxType="string"==typeof e?e:a,i[1]=s;for(var l=2;l<o;l++)i[l]=n[l];return r.createElement.apply(null,i)}return r.createElement.apply(null,n)}u.displayName="MDXCreateElement"},5948:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return s},contentTitle:function(){return c},metadata:function(){return l},toc:function(){return p},default:function(){return u}});var r=n(7462),a=n(3366),o=(n(7294),n(3905)),i=["components"],s={title:"Recoil Sync Library",sidebar_label:"Introduction"},c=void 0,l={unversionedId:"recoil-sync/introduction",id:"recoil-sync/introduction",title:"Recoil Sync Library",description:"---",source:"@site/docs/recoil-sync/introduction.md",sourceDirName:"recoil-sync",slug:"/recoil-sync/introduction",permalink:"/zh-hans/docs/recoil-sync/introduction",editUrl:"https://github.com/facebookexperimental/Recoil/edit/docs/docs/i18n/zh-hans/docusaurus-plugin-content-docs/current/recoil-sync/introduction.md",tags:[],version:"current",frontMatter:{title:"Recoil Sync Library",sidebar_label:"Introduction"},sidebar:"recoil-sync",next:{title:"Syncing Atoms",permalink:"/zh-hans/docs/recoil-sync/sync-effect"}},p=[{value:"Example",id:"example",children:[{value:"URL Persistence",id:"url-persistence",children:[],level:3}],level:2},{value:"Installation",id:"installation",children:[],level:2}],m={toc:p};function u(e){var t=e.components,n=(0,a.Z)(e,i);return(0,o.kt)("wrapper",(0,r.Z)({},m,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("hr",null),(0,o.kt)("blockquote",null,(0,o.kt)("h2",{parentName:"blockquote",id:"\ufe0f-preview-documentation-\ufe0f"},"\u2757\ufe0f ",(0,o.kt)("em",{parentName:"h2"},"Preview Documentation")," \u2757\ufe0f"),(0,o.kt)("p",{parentName:"blockquote"},(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("em",{parentName:"strong"},"This is preview documentation for the recoil-sync library before it is released.")),(0,o.kt)("br",null),"\n",(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("em",{parentName:"strong"},(0,o.kt)("a",{parentName:"em",href:"https://github.com/facebookexperimental/Recoil/tree/main/packages/recoil-sync"},"Source is available here"),".")))),(0,o.kt)("hr",null),(0,o.kt)("p",null,"The ",(0,o.kt)("inlineCode",{parentName:"p"},"recoil-sync")," package provides an add-on library to help synchronize Recoil state with external systems.  Simple ",(0,o.kt)("a",{parentName:"p",href:"/docs/guides/asynchronous-data-queries"},"asynchronous data queries")," can be implemented via selectors or ",(0,o.kt)("inlineCode",{parentName:"p"},"useEffect()"),", or ",(0,o.kt)("a",{parentName:"p",href:"/docs/guides/atom-effects"},"atom effects")," can be used for bi-directional syncing of individual atoms.  The ",(0,o.kt)("inlineCode",{parentName:"p"},"recoil-sync")," add-on package provides some additional functionality:"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("strong",{parentName:"li"},"Batching Atomic Transactions")," - Updates for multiple atoms can be batched together as a single transaction with the external system.  This can be important if an atomic transaction is required for consistent state of related atoms."),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("strong",{parentName:"li"},"Abstract and Flexible")," - This API allows users to specify what atoms to sync separately from describing the mechanism of how to sync.  This allows components to use atoms and sync with different systems in different environments without changing their implementation.  For example, a component may use atoms that persist to the URL when used in a stand-alone tool while persisting to a custom user database when embedded in another tool."),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("strong",{parentName:"li"},"Validation and Backward Compatibility")," - When dealing with state from external sources it is important to validate the input.  When state is persisted beyond the lifetime of an app it can also be important to consider backward compatibility of previous versions of state.  ",(0,o.kt)("inlineCode",{parentName:"li"},"recoil-sync")," and ",(0,o.kt)("a",{parentName:"li",href:"/docs/refine/introduction"},(0,o.kt)("inlineCode",{parentName:"a"},"refine"))," help provide this functionality."),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("strong",{parentName:"li"},"Complex Mapping of Atoms to External Storage")," - There may not be a one-to-one mapping between atoms and external storage items.  Atoms may migrate to use newer versions of items, may pull props from multiple items, just a piece of some compound state, or other complex mappings."),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("strong",{parentName:"li"},"Sync with React Hooks or Props")," - This library enables syncing atoms with React hooks or props that are not accessible from atom effects.")),(0,o.kt)("p",null,"The ",(0,o.kt)("inlineCode",{parentName:"p"},"recoil-sync")," library also provides built-in implementations for external stores, such as ",(0,o.kt)("a",{parentName:"p",href:"/docs/recoil-sync/url-persistence"},"syncing with the browser URL"),"."),(0,o.kt)("hr",null),(0,o.kt)("p",null,"The basic idea is that a ",(0,o.kt)("a",{parentName:"p",href:"/docs/recoil-sync/sync-effect"},(0,o.kt)("inlineCode",{parentName:"a"},"syncEffect()"))," can be added to each atom that you wish to sync, and then a ",(0,o.kt)("a",{parentName:"p",href:"/docs/recoil-sync/api/useRecoilSync"},(0,o.kt)("inlineCode",{parentName:"a"},"useRecoilSync()"))," or ",(0,o.kt)("a",{parentName:"p",href:"/docs/recoil-sync/api/RecoilSync"},(0,o.kt)("inlineCode",{parentName:"a"},"<RecoilSync/>"))," is added inside your ",(0,o.kt)("inlineCode",{parentName:"p"},"<RecoilRoot>")," to specify how to sync those atoms.  You can use built-in stores such as ",(0,o.kt)("a",{parentName:"p",href:"/docs/recoil-sync/url-persistence"},(0,o.kt)("inlineCode",{parentName:"a"},"<RecoilURLSyncJSON>")),", ",(0,o.kt)("a",{parentName:"p",href:"/docs/recoil-sync/implement-store"},"make your own"),", or sync different groups of atoms with different stores."),(0,o.kt)("h2",{id:"example"},"Example"),(0,o.kt)("h3",{id:"url-persistence"},"URL Persistence"),(0,o.kt)("p",null,"Here is a simple example ",(0,o.kt)("a",{parentName:"p",href:"/docs/recoil-sync/url-persistence"},"syncing an atom with the browser URL"),":"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-jsx"},"const currentUserState = atom<number>({\n  key: 'CurrentUser',\n  default: 0,\n  effects: [\n    syncEffect({ refine: number() }),\n  ],\n});\n")),(0,o.kt)("p",null,"Then, at the root of your application, simply include ",(0,o.kt)("inlineCode",{parentName:"p"},"<RecoilURLSyncJSON />")," to sync all of those tagged atoms with the URL"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-jsx"},"function MyApp() {\n  return (\n    <RecoilRoot>\n      <RecoilURLSyncJSON location={{part: 'queryParams'}} />\n      ...\n    </RecoilRoot>\n  )\n}\n")),(0,o.kt)("p",null,"That's it!  Now this atom will initialize its state based on the URL during initial load, any state mutations will update the URL, and changes in the URL (such as the back button) will update the atom.  See more examples in the ",(0,o.kt)("a",{parentName:"p",href:"/docs/recoil-sync/sync-effect"},"Sync Effect"),", ",(0,o.kt)("a",{parentName:"p",href:"/docs/recoil-sync/implement-store"},"Store Implementation"),", and ",(0,o.kt)("a",{parentName:"p",href:"/docs/recoil-sync/url-persistence"},"URL Persistence")," guides."),(0,o.kt)("h2",{id:"installation"},"Installation"),(0,o.kt)("p",null,"Please see the ",(0,o.kt)("a",{parentName:"p",href:"/docs/introduction/installation"},"Recoil installation guide")," and add ",(0,o.kt)("inlineCode",{parentName:"p"},"recoil-sync")," as an additional dependency."),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"recoil-sync")," also includes the ",(0,o.kt)("a",{parentName:"p",href:"/docs/refine/introduction"},(0,o.kt)("inlineCode",{parentName:"a"},"refine"))," library."))}u.isMDXComponent=!0}}]);