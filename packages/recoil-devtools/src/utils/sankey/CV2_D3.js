/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+obviz
 * @flow strict-local
 * @format
 */
'use strict';

import objectEntries from '../ObjectEntries';
import type {Selection as D3Selection} from 'd3-selection';

const d3 = {
  ...require('d3-selection'),
  ...require('d3-transition'),
};

// Styles objects use CSS style names for the keys (not using camel case).
// The values are either static values or a function that takes a data element
// and returns the new value.  Values may be null to remove a style.
export type Styles<T> = $ReadOnly<{
  [string]: null | string | number | (T => string | number | null),
}>;

// Attributes objects use attribute names for keys.  The values are either
// static values or a function which takes a data element and returns the value.
// Values may be null to remove the attribute.
export type Attributes<T> = $ReadOnly<{
  [string]: null | string | number | (T => string | number | null),
}>;

// Events objects are similar, only use DOM event typenames for the keys
// such as click or mouseenter.
export type Events<T> = $ReadOnly<{
  [string]: null | (T => void),
}>;

type Options = {
  animationDurationMS: number,
};

const OPTION_DEFAULTS: Options = {
  animationDurationMS: 2000,
};

class Selection<T> {
  all: D3Selection;
  new: D3Selection;
  old: D3Selection;
  update: D3Selection;
  options: Options;

  constructor(
    props: {
      all: D3Selection,
      new: D3Selection,
      old: D3Selection,
      update: D3Selection,
    },
    options: Options,
  ) {
    this.all = props.all;
    this.new = props.new;
    this.old = props.old;
    this.update = props.update;
    this.options = options;
  }

  // Select nested elements based on the selector and bind data to them
  bind<U>(
    selector: string,
    data: $ReadOnlyArray<U>,
    key: U => string | number,
  ): Selection<U> {
    const [tag, className] = selector.split('.');

    const updateSelection = this.all.selectAll(selector).data<T>(data, key);
    updateSelection
      .interrupt('binding')
      .transition('binding')
      .duration(this.options.animationDurationMS / 2)
      .style('opacity', 1);

    const newSelector = updateSelection
      .enter()
      .append(tag)
      .classed(className, true);
    newSelector.style('opacity', 0);
    newSelector
      .transition('binding')
      .duration(this.options.animationDurationMS)
      .style('opacity', 1);

    const oldSelector = updateSelection.exit();
    oldSelector
      .transition('binding')
      .duration(this.options.animationDurationMS / 2)
      .style('opacity', 0)
      .remove();

    const allSelector = updateSelection.merge(newSelector);
    return new Selection(
      {
        all: allSelector,
        new: newSelector,
        old: oldSelector,
        update: updateSelection,
      },
      this.options,
    );
  }

  // Select a nested element for each element in the current selection.
  // Each element inherits the data bound to it from the parent selection.
  select(selector: string): Selection<T> {
    const [tag, className] = selector.split('.');
    // Add child elements to newly created elements in the current selection
    const newSelection = this.new.append(tag);
    // If the current selection contains existing elements that do not have
    // the child elements, then add them to existing elements.
    if (newSelection.empty()) {
      this.all.each(function () {
        const parent = d3.select(this);
        const child = parent
          .selectAll(selector)
          .data(parent.data())
          .enter()
          .append(tag);
        if (className != null) {
          child.classed(className, true);
        }
      });
    }
    if (className != null) {
      newSelection.classed(className, true);
    }
    return new Selection(
      {
        all: this.all.select(selector),
        new: newSelection,
        old: this.old.select(selector),
        update: this.update.select(selector),
      },
      this.options,
    );
  }

  // Update attributes for the selection.  Animate them to their new values.
  attr(attrs?: Attributes<T>): Selection<T> {
    if (attrs != null) {
      function attr(selection, attrs) {
        for (const [attr, value] of objectEntries(attrs)) {
          selection.attr(attr, value ?? null);
        }
      }
      attr(this.new, attrs);
      attr(
        this.update
          .transition('attrs')
          .duration(this.options.animationDurationMS),
        attrs,
      );
    }
    return this;
  }

  // Apply styles to the selection
  style(styles?: Styles<T>): Selection<T> {
    if (styles != null) {
      for (const [style, value] of objectEntries(styles)) {
        this.all.style(style, value ?? null);
      }
    }
    return this;
  }

  // Add event listeners to the selection
  on(events?: Events<T>): Selection<T> {
    if (events != null) {
      for (const [event, handler] of objectEntries(events)) {
        this.all.on(event, handler);
      }
    }
    return this;
  }

  // Set the inner text of the elements in the selection.
  text(str: string | (T => string)): Selection<T> {
    this.all.text(str);
    return this;
  }

  // Set the inner HTML for the elements in the selection.
  html(str: string | (T => string)): Selection<T> {
    this.all.html(str);
    return this;
  }
}

export function select(el: Element, options: $Shape<Options>): Selection<void> {
  const selection = d3.select(el);
  return new Selection(
    {
      all: selection,
      new: d3.select(),
      old: d3.select(),
      update: selection,
    },
    {...OPTION_DEFAULTS, ...options},
  );
}
