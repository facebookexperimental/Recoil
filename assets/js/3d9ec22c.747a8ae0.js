"use strict";(self.webpackChunkrecoil=self.webpackChunkrecoil||[]).push([[1946],{3905:function(e,t,a){a.d(t,{Zo:function(){return p},kt:function(){return h}});var n=a(7294);function i(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function r(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function l(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?r(Object(a),!0).forEach((function(t){i(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):r(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function o(e,t){if(null==e)return{};var a,n,i=function(e,t){if(null==e)return{};var a,n,i={},r=Object.keys(e);for(n=0;n<r.length;n++)a=r[n],t.indexOf(a)>=0||(i[a]=e[a]);return i}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(n=0;n<r.length;n++)a=r[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(i[a]=e[a])}return i}var s=n.createContext({}),c=function(e){var t=n.useContext(s),a=t;return e&&(a="function"==typeof e?e(t):l(l({},t),e)),a},p=function(e){var t=c(e.components);return n.createElement(s.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},m=n.forwardRef((function(e,t){var a=e.components,i=e.mdxType,r=e.originalType,s=e.parentName,p=o(e,["components","mdxType","originalType","parentName"]),m=c(a),h=i,f=m["".concat(s,".").concat(h)]||m[h]||u[h]||r;return a?n.createElement(f,l(l({ref:t},p),{},{components:a})):n.createElement(f,l({ref:t},p))}));function h(e,t){var a=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var r=a.length,l=new Array(r);l[0]=m;var o={};for(var s in t)hasOwnProperty.call(t,s)&&(o[s]=t[s]);o.originalType=e,o.mdxType="string"==typeof e?e:i,l[1]=o;for(var c=2;c<r;c++)l[c]=a[c];return n.createElement.apply(null,l)}return n.createElement.apply(null,a)}m.displayName="MDXCreateElement"},8421:function(e,t,a){a.r(t),a.d(t,{frontMatter:function(){return o},contentTitle:function(){return s},metadata:function(){return c},assets:function(){return p},toc:function(){return u},default:function(){return h}});var n=a(7462),i=a(3366),r=(a(7294),a(3905)),l=["components"],o={title:"Recoil 0.6"},s=void 0,c={permalink:"/blog/2022/01/28/0.6.0-release",editUrl:"https://github.com/facebookexperimental/Recoil/edit/docs/docs/blog/blog/2022-01-28-0.6.0-release.md",source:"@site/blog/2022-01-28-0.6.0-release.md",title:"Recoil 0.6",description:"Recoil 0.6 introduces improved support for React 18, including concurrent rendering and transitions, along with new APIs, fixes, and optimizations.",date:"2022-01-28T00:00:00.000Z",formattedDate:"January 28, 2022",tags:[],readingTime:3.11,truncated:!1,authors:[],nextItem:{title:"Recoil 0.5",permalink:"/blog/2021/11/03/0.5.0-release"}},p={authorsImageUrls:[]},u=[{value:"React 18",id:"react-18",children:[{value:"Concurrent Rendering and Transitions",id:"concurrent-rendering-and-transitions",children:[],level:3}],level:2},{value:"New Features",id:"new-features",children:[],level:2},{value:"Breaking Changes",id:"breaking-changes",children:[],level:2},{value:"Other Fixes and Optimizations",id:"other-fixes-and-optimizations",children:[],level:2}],m={toc:u};function h(e){var t=e.components,a=(0,i.Z)(e,l);return(0,r.kt)("wrapper",(0,n.Z)({},m,a,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("p",null,"Recoil 0.6 introduces improved support for React 18, including concurrent rendering and transitions, along with new APIs, fixes, and optimizations."),(0,r.kt)("h2",{id:"react-18"},"React 18"),(0,r.kt)("p",null,"Recoil 0.6 uses the latest APIs from React 18 for improved safety and performance.  This release is compatible with ",(0,r.kt)("a",{parentName:"p",href:"https://reactjs.org/blog/2021/06/08/the-plan-for-react-18.html#whats-coming-in-react-18"},"concurrent rendering")," and ",(0,r.kt)("a",{parentName:"p",href:"https://reactjs.org/docs/strict-mode.html"},(0,r.kt)("inlineCode",{parentName:"a"},"<React.StrictMode>")),", which is useful for testing and identifying potential issues for concurrent rendering.  Making Recoil and React state changes in the same batch now stay in sync to provided a consistent view of state.  Some of these improvements are also available while using previous versions of React.  ",(0,r.kt)("em",{parentName:"p"},"When experimenting with React 18 please use the latest RC build, as the original React ",(0,r.kt)("inlineCode",{parentName:"em"},"18.0.0-rc.0")," package has a bug that has since been fixed.")),(0,r.kt)("h3",{id:"concurrent-rendering-and-transitions"},"Concurrent Rendering and Transitions"),(0,r.kt)("p",null,"React 18 offers a new hook ",(0,r.kt)("a",{parentName:"p",href:"https://reactjs.org/docs/concurrent-mode-patterns.html#transitions"},(0,r.kt)("inlineCode",{parentName:"a"},"useTransition()"))," for transitioning to a new state while having control over what to render before the new state is ready.  Recoil should be compatible with this approach and provides a consistent view with React state.  However, React 18 may fallback from concurrent updates and does not yet officially support initiating transitions based on state changes to external stores.  This is something the React team is looking into supporting, but until then we have added experimental support for this through the following hooks.  This API is considered experimental because there may be use cases we haven\u2019t found which are not handled."),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"useRecoilState_TRANSITION_SUPPORT_UNSTABLE()")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"useRecoilValue_TRANSITION_SUPPORT_UNSTABLE()")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"useRecoilValueLoadable_TRANSITION_SUPPORT_UNSTABLE()"))),(0,r.kt)("p",null,"Here's an example that displays the current results while a new result is loading:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-jsx"},"function QueryResults() {\n  const queryParams = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(queryParamsAtom);\n  const results = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(myQuerySelector(queryParams));\n  return results;\n}\n\nfunction MyApp() {\n  const [queryParams, setQueryParams] = useRecoilState_TRANSITION_SUPPORT_UNSTABLE(queryParamsAtom);\n  const [inTransition, startTransition] = useTransition();\n  return (\n    <div>\n      {inTransition ? <div>[Loading new results...]</div> : ''}\n      Results: <React.Suspense><QueryResults /></React.Suspense>\n      <button\n        onClick={() => {\n          startTransition(() => {\n            setQueryParams(...new params...);\n          });\n        }\n      >\n        Start New Query\n      </button>\n    </div>\n  );\n}\n")),(0,r.kt)("h2",{id:"new-features"},"New Features"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"Recoil Callbacks",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/docs/api-reference/core/useRecoilCallback"},(0,r.kt)("inlineCode",{parentName:"a"},"useRecoilCallback()"))," can now also refresh selector caches, similar to ",(0,r.kt)("a",{parentName:"li",href:"/docs/api-reference/core/useRecoilRefresher"},(0,r.kt)("inlineCode",{parentName:"a"},"useRecoilRefresher_UNSTABLE()")),". (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1413"},"#1413"),")"),(0,r.kt)("li",{parentName:"ul"},"Callbacks from selectors using ",(0,r.kt)("a",{parentName:"li",href:"/docs/api-reference/core/selector#returning-objects-with-callbacks"},(0,r.kt)("inlineCode",{parentName:"a"},"getCallback()"))," can now mutate, refresh, and transact state in addition to reading it, similar to ",(0,r.kt)("a",{parentName:"li",href:"/docs/api-reference/core/useRecoilCallback"},(0,r.kt)("inlineCode",{parentName:"a"},"useRecoilCallback()")),". (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1498"},"#1498"),")"))),(0,r.kt)("li",{parentName:"ul"},"Store IDs - A ",(0,r.kt)("inlineCode",{parentName:"li"},"StoreID")," can now be obtained using ",(0,r.kt)("a",{parentName:"li",href:"/docs/api-reference/core/useRecoilStoreID"},(0,r.kt)("inlineCode",{parentName:"a"},"useRecoilStoreID()"))," (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1417"},"#1417"),") or the ",(0,r.kt)("inlineCode",{parentName:"li"},"storeID")," parameter in ",(0,r.kt)("a",{parentName:"li",href:"/docs/guides/atom-effects"},"atom effects"),"  (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1414"},"#1414"),")."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/docs/api-reference/core/Loadable#examples"},(0,r.kt)("inlineCode",{parentName:"a"},"RecoilLoadable.of()"))," and ",(0,r.kt)("a",{parentName:"li",href:"/docs/api-reference/core/Loadable#examples"},(0,r.kt)("inlineCode",{parentName:"a"},"RecoilLoadable.all()"))," factories now accept either literal values, async Promises, or Loadables.  This is comparable to ",(0,r.kt)("inlineCode",{parentName:"li"},"Promise.resolve()")," and ",(0,r.kt)("inlineCode",{parentName:"li"},"Promise.all()"),"  (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1455"},"#1455"),", ",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1442"},"#1442"),")."),(0,r.kt)("li",{parentName:"ul"},"Add ",(0,r.kt)("inlineCode",{parentName:"li"},".isRetained()")," method for Snapshots and check if snapshot is already released when using ",(0,r.kt)("inlineCode",{parentName:"li"},".retain()")," in development (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1546"},"#1546"),")")),(0,r.kt)("h2",{id:"breaking-changes"},"Breaking Changes"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"Atom Effects",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"Rename option from ",(0,r.kt)("inlineCode",{parentName:"li"},"effects_UNSTABLE")," to just ",(0,r.kt)("inlineCode",{parentName:"li"},"effects"),", as the interface is mostly stabilizing. (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1520"},"#1520"),")"),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/docs/guides/atom-effects"},"Atom effect")," initializations takes precedence over ",(0,r.kt)("inlineCode",{parentName:"li"},"<RecoilRoot initializeState={...}>"),". (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1509"},"#1509"),")"))),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"useGetRecoilValueInfo_UNSTABLE()")," and ",(0,r.kt)("inlineCode",{parentName:"li"},"Snapshot#getInfo_UNSTABLE()")," always report the node ",(0,r.kt)("inlineCode",{parentName:"li"},"type"),". (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1547"},"#1547"),")")),(0,r.kt)("h2",{id:"other-fixes-and-optimizations"},"Other Fixes and Optimizations"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"Reduce overhead of snapshot cloning",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"Only clone the current snapshot for callbacks if the callback actually uses it. (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1501"},"#1501"),")"),(0,r.kt)("li",{parentName:"ul"},"Cache the cloned snapshots from callbacks unless there was a state change. (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1533"},"#1533"),")"))),(0,r.kt)("li",{parentName:"ul"},"Fix transitive selector refresh for some cases (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1409"},"#1409"),")"),(0,r.kt)("li",{parentName:"ul"},"Fix some corner cases with async selectors and multiple stores (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1568"},"#1568"),")"),(0,r.kt)("li",{parentName:"ul"},"Atom effects",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"Run atom effects when atoms are initialized from a ",(0,r.kt)("inlineCode",{parentName:"li"},"set()")," during a transaction from ",(0,r.kt)("a",{parentName:"li",href:"/docs/api-reference/core/useRecoilTransaction"},(0,r.kt)("inlineCode",{parentName:"a"},"useRecoilTransaction_UNSTABLE()"))," (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1466"},"#1466"),", ",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1569"},"#1569"),")"),(0,r.kt)("li",{parentName:"ul"},"Atom effects are cleaned up when initialized by a Snapshot which is released. (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1511"},"#1511"),", ",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1532"},"#1532"),")"),(0,r.kt)("li",{parentName:"ul"},"Unsubscribe ",(0,r.kt)("inlineCode",{parentName:"li"},"onSet()")," handlers in atom effects when atoms are cleaned up. (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1509"},"#1509"),")"),(0,r.kt)("li",{parentName:"ul"},"Call ",(0,r.kt)("inlineCode",{parentName:"li"},"onSet()")," when atoms are initialized with ",(0,r.kt)("inlineCode",{parentName:"li"},"<RecoilRoot initializeState={...} >")," (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1519"},"#1519"),", ",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1511"},"#1511"),")"))),(0,r.kt)("li",{parentName:"ul"},"Avoid extra re-renders in some cases when a component uses a different atom/selector. (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/825"},"#825"),")"),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"<RecoilRoot>")," will only call ",(0,r.kt)("inlineCode",{parentName:"li"},"initializeState()")," once during the initial render. (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1372"},"#1372"),")"),(0,r.kt)("li",{parentName:"ul"},"Lazily compute and memoize the results of lazy properties, such as from ",(0,r.kt)("inlineCode",{parentName:"li"},"useGetRecoilValueInfo()")," or ",(0,r.kt)("inlineCode",{parentName:"li"},"Snapshot#getInfo_UNSTABLE()"),". (",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1548"},"#1548"),", ",(0,r.kt)("a",{parentName:"li",href:"https://github.com/facebookexperimental/Recoil/pull/1549"},"#1549"),")")))}h.isMDXComponent=!0}}]);