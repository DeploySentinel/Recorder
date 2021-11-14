import { finder } from '@medv/finder';

import type { Action } from './recorder';

function genAttributeSet(element: HTMLElement, attributes: string[]) {
  return new Set(
    attributes.filter((attr) => {
      const attrValue = element.getAttribute(attr);
      return attrValue != null && attrValue.length > 0;
    })
  );
}

function isAttributesDefined(element: HTMLElement, attributes: string[]) {
  return genAttributeSet(element, attributes).size > 0;
}

// Gets all attributes that aren't null and empty
function genValidAttributeFilter(element: HTMLElement, attributes: string[]) {
  const attrSet = genAttributeSet(element, attributes);

  return (name: string) => attrSet.has(name);
}

function genSelectorForAttributes(element: HTMLElement, attributes: string[]) {
  let selector = null;
  try {
    selector = isAttributesDefined(element, attributes)
      ? finder(element, {
          idName: () => false, // Don't use the id to generate a selector
          attr: genValidAttributeFilter(element, attributes),
        })
      : null;
  } catch (e) {}

  return selector;
}

export default function genSelectors(element: HTMLElement | null) {
  if (element == null) {
    return null;
  }

  const href = element.getAttribute('href');

  let generalSelector = null;
  try {
    generalSelector = finder(element);
  } catch (e) {}

  let attrSelector = null;
  try {
    attrSelector = finder(element, { attr: () => true });
  } catch (e) {}

  const hrefSelector = genSelectorForAttributes(element, ['href']);
  const formSelector = genSelectorForAttributes(element, [
    'name',
    'placeholder',
    'for',
  ]);
  const accessibilitySelector = genSelectorForAttributes(element, [
    'aria-label',
    'alt',
    'title',
  ]);

  const testIdSelector = genSelectorForAttributes(element, [
    'data-testid',
    'data-test-id',
    'data-testing',
    'data-test',
    'data-qa',
  ]);

  // Certain apps don't have unique ids (ex. youtube)
  const idSelector = genSelectorForAttributes(element, ['id']);

  return {
    id: idSelector,
    generalSelector,
    attrSelector,
    testIdSelector,
    text: element.innerText,
    href,
    // Only try to pick an href selector if there is an href on the element
    hrefSelector,
    accessibilitySelector,
    formSelector,
  };
}

export function getBestSelectorForAction(action: Action) {
  if (action.type === 'click' || action.type === 'hover') {
    const selectors = action.selectors;
    if (action.tagName === 'INPUT') {
      return (
        selectors.testIdSelector ??
        selectors?.id ??
        selectors?.formSelector ??
        selectors?.accessibilitySelector ??
        selectors?.generalSelector ??
        selectors?.attrSelector ??
        null
      );
    }
    if (action.tagName === 'A') {
      return (
        selectors.testIdSelector ??
        selectors?.id ??
        selectors?.hrefSelector ??
        selectors?.accessibilitySelector ??
        selectors?.generalSelector ??
        selectors?.attrSelector ??
        null
      );
    }
    return (
      selectors.testIdSelector ??
      selectors?.id ??
      selectors?.accessibilitySelector ??
      selectors?.hrefSelector ??
      selectors?.generalSelector ??
      selectors?.attrSelector ??
      null
    );
  } else if (action.type === 'input' || action.type === 'keydown') {
    const selectors = action.selectors;
    return (
      selectors.testIdSelector ??
      selectors?.id ??
      selectors?.formSelector ??
      selectors?.accessibilitySelector ??
      selectors?.generalSelector ??
      selectors?.attrSelector ??
      null
    );
  }
  return null;
}
