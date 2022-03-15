import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { getBestSelectorForAction } from './selector';
import { PlaywrightScriptBuilder, PuppeteerScriptBuilder } from '../builders';

import type { Action } from '../types';
import { ActionType, ScriptType } from '../types';

const truncateText = (str: string, maxLen: number) => {
  return `${str.substring(0, maxLen)}${str.length > maxLen ? '...' : ''}`;
};

function describeAction(action: Action) {

  return action?.type === ActionType.Click
    ? `Click on <${action.tagName.toLowerCase()}> ${
        action.selectors.text != null && action.selectors.text.length > 0
          ? `"${truncateText(action.selectors.text.replace('\n', ' '), 25)}"`
          : getBestSelectorForAction(action)
      }`
    : action?.type === ActionType.Hover
    ? `Hover over <${action.tagName.toLowerCase()}> ${
        action.selectors.text != null && action.selectors.text.length > 0
          ? `"${truncateText(action.selectors.text.replace('\n', ' '), 25)}"`
          : getBestSelectorForAction(action)
      }`
    : action?.type === ActionType.Input
    ? `Fill "${
        action.value
      }" on <${action.tagName.toLowerCase()}> ${getBestSelectorForAction(
        action
      )}`
    : action?.type == ActionType.Keydown
    ? `Press ${action.key} on ${action.tagName.toLowerCase()}`
    : action?.type == ActionType.Load
    ? `Load "${action.url}"`
    : action.type === ActionType.Resize
    ? `Resize window to ${action.width} x ${action.height}`
    : action.type === ActionType.Wheel
    ? `Scroll wheel by X:${action.deltaX}, Y:${action.deltaY}`
    : action.type === ActionType.FullScreenshot
    ? `Take full page screenshot`
    : action.type === ActionType.AwaitText
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

export const isSupportedActionType = (actionType: any) => {
  return [
    ActionType.Click,
    ActionType.Hover,
    ActionType.Keydown,
    ActionType.Input,
    ActionType.Load,
    ActionType.Resize,
    ActionType.Wheel,
    ActionType.FullScreenshot,
    ActionType.AwaitText,
  ].includes(actionType);
}

export function genCode(
  actions: Action[],
  showComments: boolean = true,
  lib: ScriptType = 'playwright' as ScriptType,
): string {
  const scriptBuilder =
    lib === 'playwright'
      ? new PlaywrightScriptBuilder()
      : new PuppeteerScriptBuilder();

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    if (!(isSupportedActionType(action.type))) {
      continue;
    }

    const nextAction = actions[i + 1];
    const causesNavigation = nextAction?.type === ActionType.Navigate;
    const actionDescription = `${describeAction(action)}${
      causesNavigation && lib === 'puppeteer' ? ' and await navigation' : ''
    }`;

    if (showComments) {
      scriptBuilder.pushComments(`// ${actionDescription}`);
    }

    let bestSelector = null;

    // Selector-based actions
    if (
      action.type === ActionType.Click ||
      action.type === ActionType.Input ||
      action.type === ActionType.Keydown ||
      action.type === ActionType.Hover
    ) {
      bestSelector = getBestSelectorForAction(action);
      if (bestSelector === null) {
        throw new Error(`Cant generate selector for action ${action}`);
      }
    }

    switch (action.type) {
      case ActionType.Click:
        scriptBuilder.click(bestSelector as string, causesNavigation);
        break;
      case ActionType.Hover:
        scriptBuilder.hover(bestSelector as string, causesNavigation);
        break;
      case ActionType.Keydown:
        scriptBuilder.keydown(
          bestSelector as string,
          action.key ?? '',
          causesNavigation
        );
        break;
      case ActionType.Input: {
        if (action.tagName === 'SELECT') {
          scriptBuilder.select(
            bestSelector as string,
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
          scriptBuilder.fill(
            bestSelector as string,
            action.value ?? '',
            causesNavigation
          );
        } else {
          scriptBuilder.type(
            bestSelector as string,
            action.value ?? '',
            causesNavigation
          );
        }
        break;
      }
      case ActionType.Load:
        scriptBuilder.load(action.url);
        break;
      case ActionType.Resize:
        scriptBuilder.resize(action.width, action.height);
        break;
      case ActionType.Wheel:
        scriptBuilder.wheel(action.deltaX, action.deltaY);
        break;
      case ActionType.FullScreenshot:
        scriptBuilder.fullScreenshot();
        break;
      case ActionType.AwaitText:
        scriptBuilder.awaitText(action.text);
        break;
      default:
        break;
    }
  }

  return scriptBuilder.build();
}

export default function CodeGen({
  actions,
  library,
  styles,
}: {
  actions: Action[];
  library: ScriptType;
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
