import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { getBestSelectorForAction } from './selector';
import { PlaywrightScriptBuilder, PuppeteerScriptBuilder } from '../builders';

import type { Action } from '../types';

const truncateText = (str: string, maxLen: number) => {
  return `${str.substring(0, maxLen)}${str.length > maxLen ? '...' : ''}`;
};

function describeAction(action: Action) {

  return action?.type === 'click'
    ? `Click on <${action.tagName.toLowerCase()}> ${
        action.selectors.text != null && action.selectors.text.length > 0
          ? `"${truncateText(action.selectors.text.replace('\n', ' '), 25)}"`
          : getBestSelectorForAction(action)
      }`
    : action?.type === 'hover'
    ? `Hover over <${action.tagName.toLowerCase()}> ${
        action.selectors.text != null && action.selectors.text.length > 0
          ? `"${truncateText(action.selectors.text.replace('\n', ' '), 25)}"`
          : getBestSelectorForAction(action)
      }`
    : action?.type === 'input'
    ? `Fill "${
        action.value
      }" on <${action.tagName.toLowerCase()}> ${getBestSelectorForAction(
        action
      )}`
    : action?.type == 'keydown'
    ? `Press ${action.key} on ${action.tagName.toLowerCase()}`
    : action?.type == 'load'
    ? `Load "${action.url}"`
    : action.type === 'resize'
    ? `Resize window to ${action.width} x ${action.height}`
    : action.type === 'wheel'
    ? `Scroll wheel by X:${action.deltaX}, Y:${action.deltaY}`
    : action.type === 'fullScreenshot'
    ? `Take full page screenshot`
    : action.type === 'awaitText'
    ? `Wait for text "${truncateText(action.text, 25)}" to appear`
    : '';
}

const fillableInputTypes = new Set([
  '',
  'email',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'url',
  'date',
  'time',
  'datetime',
  'datetime-local',
  'month',
  'week',
]);

export function genCode(
  actions: Action[],
  showComments: boolean = true,
  lib: 'playwright' | 'puppeteer' = 'playwright'
): string {
  const scriptBuilder =
    lib === 'playwright'
      ? new PlaywrightScriptBuilder()
      : new PuppeteerScriptBuilder();
  const lines = actions.map((action, i) => {
    const nextAction = actions[i + 1];
    const causesNavigation = nextAction?.type === 'navigate';
    const actionDescription = `${describeAction(action)}${
      causesNavigation && lib === 'puppeteer' ? ' and await navigation' : ''
    }`;
    let line = '';

    // Selector-based actions
    if (
      action.type === 'click' ||
      action.type === 'input' ||
      action.type === 'keydown' ||
      action.type === 'hover'
    ) {
      const bestSelector = getBestSelectorForAction(action);
      if (bestSelector == null) {
        throw new Error(`Cant generate selector for action ${action}`);
      }

      if (action.type === 'click') {
        line += scriptBuilder.click(bestSelector, causesNavigation);
      } else if (action.type === 'hover') {
        line += scriptBuilder.hover(bestSelector, causesNavigation);
      } else if (action.type === 'keydown') {
        line += scriptBuilder.keydown(
          bestSelector,
          action.key ?? '',
          causesNavigation
        );
      } else if (action.type === 'input') {
        if (action.tagName === 'SELECT') {
          line += scriptBuilder.select(
            bestSelector,
            action.value ?? '',
            causesNavigation
          );
        } else if (
          // If the input is "fillable" or a text area
          (action.tagName === 'INPUT' &&
            action.inputType != null &&
            fillableInputTypes.has(action.inputType)) ||
          action.tagName === 'TEXTAREA'
        ) {
          // Do more actionability checks
          line += scriptBuilder.fill(
            bestSelector,
            action.value ?? '',
            causesNavigation
          );
        } else {
          line += scriptBuilder.type(
            bestSelector,
            action.value ?? '',
            causesNavigation
          );
        }
      }
    } else if (action.type === 'load') {
      line += scriptBuilder.load(action.url);
    } else if (action.type === 'resize') {
      line += scriptBuilder.resize(action.width, action.height);
    } else if (action.type === 'wheel') {
      line += scriptBuilder.wheel(action.deltaX, action.deltaY);
    } else if (action.type === 'fullScreenshot') {
      line += scriptBuilder.fullScreenshot();
    } else if (action.type === 'awaitText') {
      line += scriptBuilder.awaitText(action.text);
    } else {
      return null;
    }
    return `${showComments ? `  // ${actionDescription}\n` : ''}  ${line}`;
  });

  return scriptBuilder.fileTemplate(
    lines.filter((v) => v != null).join('\n\n')
  );
}

export default function CodeGen({
  actions,
  library,
  styles,
}: {
  actions: Action[];
  library: 'playwright' | 'puppeteer';
  styles?: React.CSSProperties;
}) {
  return (
    <SyntaxHighlighter
      language="javascript"
      style={vscDarkPlus}
      customStyle={{
        background: 'none',
        padding: 0,
        overflow: 'auto',
        paddingRight: '1em',
        paddingBottom: '1em',
        ...(styles || {}),
      }}
      data-testid="code-block"
    >
      {genCode(actions, true, library)}
    </SyntaxHighlighter>
  );
}
