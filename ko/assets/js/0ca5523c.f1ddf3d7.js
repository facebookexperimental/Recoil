"use strict";(self.webpackChunkrecoil=self.webpackChunkrecoil||[]).push([[1811],{3905:function(e,t,n){n.d(t,{Zo:function(){return l},kt:function(){return m}});var r=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var u=r.createContext({}),c=function(e){var t=r.useContext(u),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},l=function(e){var t=c(e.components);return r.createElement(u.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,a=e.originalType,u=e.parentName,l=s(e,["components","mdxType","originalType","parentName"]),d=c(n),m=o,f=d["".concat(u,".").concat(m)]||d[m]||p[m]||a;return n?r.createElement(f,i(i({ref:t},l),{},{components:n})):r.createElement(f,i({ref:t},l))}));function m(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=n.length,i=new Array(a);i[0]=d;var s={};for(var u in t)hasOwnProperty.call(t,u)&&(s[u]=t[u]);s.originalType=e,s.mdxType="string"==typeof e?e:o,i[1]=s;for(var c=2;c<a;c++)i[c]=n[c];return r.createElement.apply(null,i)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},1594:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return s},contentTitle:function(){return u},metadata:function(){return c},toc:function(){return l},default:function(){return d}});var r=n(7462),o=n(3366),a=(n(7294),n(3905)),i=["components"],s={title:"React 18 Transitions",sidebar_label:"Transitions"},u=void 0,c={unversionedId:"guides/transitions",id:"guides/transitions",title:"React 18 Transitions",description:"React 18 offers a new hook useTransition() for transitioning to a new state while having control over what to render before the new state is ready.  Recoil should be compatible with this approach and provides a consistent view with React state.  However, React 18 may fallback from concurrent updates and does not yet officially support initiating transitions based on state changes to external stores.  This is something the React team is looking into supporting, but until then we have added experimental support for this through the following hooks.  This API is considered experimental because there may be use cases we haven\u2019t found which are not handled.",source:"@site/docs/guides/transitions.md",sourceDirName:"guides",slug:"/guides/transitions",permalink:"/ko/docs/guides/transitions",editUrl:"https://github.com/facebookexperimental/Recoil/edit/docs/docs/i18n/ko/docusaurus-plugin-content-docs/current/guides/transitions.md",tags:[],version:"current",frontMatter:{title:"React 18 Transitions",sidebar_label:"Transitions"},sidebar:"docs",previous:{title:"\ud14c\uc2a4\ud305",permalink:"/ko/docs/guides/testing"},next:{title:"\uac1c\ubc1c \ub3c4\uad6c",permalink:"/ko/docs/guides/dev-tools"}},l=[],p={toc:l};function d(e){var t=e.components,n=(0,o.Z)(e,i);return(0,a.kt)("wrapper",(0,r.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"https://reactjs.org/blog/2021/06/08/the-plan-for-react-18.html"},"React 18")," offers a new hook ",(0,a.kt)("a",{parentName:"p",href:"https://reactjs.org/docs/concurrent-mode-patterns.html#transitions"},(0,a.kt)("strong",{parentName:"a"},(0,a.kt)("inlineCode",{parentName:"strong"},"useTransition()")))," for transitioning to a new state while having control over what to render before the new state is ready.  Recoil should be compatible with this approach and provides a consistent view with React state.  However, React 18 may fallback from concurrent updates and does not yet officially support initiating transitions based on state changes to external stores.  This is something the React team is looking into supporting, but until then we have added experimental support for this through the following hooks.  This API is considered experimental because there may be use cases we haven\u2019t found which are not handled."),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("strong",{parentName:"li"},(0,a.kt)("inlineCode",{parentName:"strong"},"useRecoilState_TRANSITION_SUPPORT_UNSTABLE()"))),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("strong",{parentName:"li"},(0,a.kt)("inlineCode",{parentName:"strong"},"useRecoilValue_TRANSITION_SUPPORT_UNSTABLE()"))),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("strong",{parentName:"li"},(0,a.kt)("inlineCode",{parentName:"strong"},"useRecoilValueLoadable_TRANSITION_SUPPORT_UNSTABLE()")))),(0,a.kt)("p",null,"Here's an example that displays the current results of a query while a new result is loading:"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-jsx"},"function QueryResults() {\n  const queryParams = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(queryParamsAtom);\n  const results = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(myQuerySelector(queryParams));\n  return results;\n}\n\nfunction MyApp() {\n  const [queryParams, setQueryParams] = useRecoilState_TRANSITION_SUPPORT_UNSTABLE(queryParamsAtom);\n  const [inTransition, startTransition] = useTransition();\n  return (\n    <div>\n      {inTransition ? <div>[Loading new results...]</div> : null}\n\n      Results: <React.Suspense><QueryResults /></React.Suspense>\n\n      <button\n        onClick={() => {\n          startTransition(() => {\n            setQueryParams(...new params...);\n          });\n        }\n      >\n        Start New Query\n      </button>\n    </div>\n  );\n}\n")))}d.isMDXComponent=!0}}]);