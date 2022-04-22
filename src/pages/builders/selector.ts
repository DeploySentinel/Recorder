import finder from './finder';

import type { Action } from '../types';
import { ActionType, ScriptType, TagName } from '../types';

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

// isCharacterNumber
function isCharacterNumber(char: string) {
  return char.length === 1 && char.match(/[0-9]/);
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
    'data-cy',
  ]);

  // We won't use an id selector if the id is invalid (starts with a number)
  let idSelector = null;
  try {
    idSelector =
      isAttributesDefined(element, ['id']) &&
      !isCharacterNumber(element.id?.[0])
        ? // Certain apps don't have unique ids (ex. youtube)
          finder(element, {
            attr: (name) => name === 'id',
          })
        : null;
  } catch (e) {}

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

export function getBestSelectorForAction(action: Action, library: ScriptType) {
  switch (action.type) {
    case ActionType.Click:
    case ActionType.Hover:
    case ActionType.DragAndDrop: {
      const selectors = action.selectors;
      // Only supported for playwright, less than 25 characters, and element only has text inside
      const textSelector =
        library === ScriptType.Playwright &&
        selectors?.text?.length != null &&
        selectors?.text?.length < 25 &&
        action.hasOnlyText
          ? `text=${selectors.text}`
          : null;

      if (action.tagName === TagName.Input) {
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
      if (action.tagName === TagName.A) {
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

      // Prefer text selectors for spans, ems over general selectors
      if (
        action.tagName === TagName.Span ||
        action.tagName === TagName.EM ||
        action.tagName === TagName.Cite ||
        action.tagName === TagName.B ||
        action.tagName === TagName.Strong
      ) {
        return (
          selectors.testIdSelector ??
          selectors?.id ??
          selectors?.accessibilitySelector ??
          selectors?.hrefSelector ??
          textSelector ??
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
    }
    case ActionType.Input:
    case ActionType.Keydown: {
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
    default:
      break;
  }
  return null;
}
