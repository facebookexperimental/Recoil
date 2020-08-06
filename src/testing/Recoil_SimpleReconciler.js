/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

const React = require('React');
const {useEffect, useRef} = require('React');

const ReactReconciler = require('react-reconciler');

const rootHostContext = {};
const childHostContext = {};

const hostConfig = {
  now: Date.now,
  getRootHostContext: () => rootHostContext,
  prepareForCommit: () => {},
  resetAfterCommit: () => {},
  getChildHostContext: () => childHostContext,
  shouldSetTextContent: (_type, props) =>
    typeof props.children === 'string' || typeof props.children === 'number',
  createInstance: (type, newProps) => {
    const domElement = document.createElement(type);
    Object.keys(newProps).forEach(propName => {
      const propValue = newProps[propName];
      if (propName === 'children') {
        if (typeof propValue === 'string' || typeof propValue === 'number') {
          domElement.textContent = propValue;
        }
      } else if (propName === 'onClick') {
        domElement.addEventListener('click', propValue);
      } else if (propName === 'className') {
        domElement.setAttribute('class', propValue);
      } else {
        const propValue = newProps[propName];
        domElement.setAttribute(propName, propValue);
      }
    });
    return domElement;
  },
  createTextInstance: text => document.createTextNode(text),
  appendInitialChild: (parent, child) => {
    parent.appendChild(child);
  },
  appendChild(parent, child) {
    parent.appendChild(child);
  },
  finalizeInitialChildren: () => {},
  supportsMutation: true,
  appendChildToContainer: (parent, child) => {
    parent.appendChild(child);
  },
  prepareUpdate: () => true,
  commitUpdate(domElement, _updatePayload, _type, _oldProps, newProps) {
    Object.keys(newProps).forEach(propName => {
      const propValue = newProps[propName];
      if (propName === 'children') {
        if (typeof propValue === 'string' || typeof propValue === 'number') {
          domElement.textContent = propValue;
        }
      } else {
        const propValue = newProps[propName];
        domElement.setAttribute(propName, propValue);
      }
    });
  },
  commitTextUpdate(textInstance, _oldText, newText) {
    textInstance.text = newText;
  },
  removeChild(parentInstance, child) {
    parentInstance.removeChild(child);
  },
};

const SimpleReconcilerInstance = ReactReconciler(hostConfig);

const SimpleRenderer = ({children}: {children: React.Node}): React.Node => {
  const containerRef = useRef();
  const reconcilerRef = useRef();

  useEffect(() => {
    reconcilerRef.current = SimpleReconcilerInstance.createContainer(
      containerRef.current,
      false,
    );
  }, []);

  useEffect(() => {
    if (reconcilerRef.current) {
      SimpleReconcilerInstance.updateContainer(
        children,
        reconcilerRef.current,
        null,
      );
    }
  }, [children]);

  return <div ref={containerRef} />;
};

module.exports = {
  SimpleRenderer,
};
