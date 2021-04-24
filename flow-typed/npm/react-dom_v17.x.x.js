// flow-typed signature: 883d1ffd89c1dd19944fb3d4876938c0
// flow-typed version: 302d4b65e2/react-dom_v17.x.x/flow_>=v0.127.x

declare module 'react-dom' {
  declare var version: string;

  declare function findDOMNode(
    componentOrElement: Element | ?React$Component<any, any>
  ): null | Element | Text;

  declare function render<ElementType: React$ElementType>(
    element: React$Element<ElementType>,
    container: Element,
    callback?: () => void
  ): React$ElementRef<ElementType>;

  declare function hydrate<ElementType: React$ElementType>(
    element: React$Element<ElementType>,
    container: Element,
    callback?: () => void
  ): React$ElementRef<ElementType>;

  declare function createPortal(
    node: React$Node,
    container: Element
  ): React$Portal;

  declare function unmountComponentAtNode(container: any): boolean;

  declare function unstable_batchedUpdates<A, B, C, D, E>(
    callback: (a: A, b: B, c: C, d: D, e: E) => mixed,
    a: A,
    b: B,
    c: C,
    d: D,
    e: E
  ): void;

  declare function unstable_renderSubtreeIntoContainer<
    ElementType: React$ElementType
  >(
    parentComponent: React$Component<any, any>,
    nextElement: React$Element<ElementType>,
    container: any,
    callback?: () => void
  ): React$ElementRef<ElementType>;
}

declare module 'react-dom/server' {
  declare var version: string;

  declare function renderToString(element: React$Node): string;

  declare function renderToStaticMarkup(element: React$Node): string;

  declare function renderToNodeStream(element: React$Node): stream$Readable;

  declare function renderToStaticNodeStream(
    element: React$Node
  ): stream$Readable;
}

declare module 'react-dom/test-utils' {
  declare type Thenable = {
    then(resolve: () => mixed, reject?: () => mixed): mixed,
    ...
  };

  declare var Simulate: {
    [eventName: string]: (
      element: Element,
      eventData?: { [key: string]: mixed, ... }
    ) => void,
    ...
  };

  declare function renderIntoDocument(
    instance: React$Element<any>
  ): React$Component<any, any>;

  declare function mockComponent(
    componentClass: React$ElementType,
    mockTagName?: string
  ): { [key: string]: mixed, ... };

  declare function isElement(element: React$Element<any>): boolean;

  declare function isElementOfType(
    element: React$Element<any>,
    componentClass: React$ElementType
  ): boolean;

  declare function isDOMComponent(instance: any): boolean;

  declare function isCompositeComponent(
    instance: React$Component<any, any>
  ): boolean;

  declare function isCompositeComponentWithType(
    instance: React$Component<any, any>,
    componentClass: React$ElementType
  ): boolean;

  declare function findAllInRenderedTree(
    tree: React$Component<any, any>,
    test: (child: React$Component<any, any>) => boolean
  ): Array<React$Component<any, any>>;

  declare function scryRenderedDOMComponentsWithClass(
    tree: React$Component<any, any>,
    className: string
  ): Array<Element>;

  declare function findRenderedDOMComponentWithClass(
    tree: React$Component<any, any>,
    className: string
  ): ?Element;

  declare function scryRenderedDOMComponentsWithTag(
    tree: React$Component<any, any>,
    tagName: string
  ): Array<Element>;

  declare function findRenderedDOMComponentWithTag(
    tree: React$Component<any, any>,
    tagName: string
  ): ?Element;

  declare function scryRenderedComponentsWithType(
    tree: React$Component<any, any>,
    componentClass: React$ElementType
  ): Array<React$Component<any, any>>;

  declare function findRenderedComponentWithType(
    tree: React$Component<any, any>,
    componentClass: React$ElementType
  ): ?React$Component<any, any>;

  declare function act(callback: () => void | Thenable): Thenable;
}
