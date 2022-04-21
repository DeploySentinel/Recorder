import React from 'react';

import { ActionType, isSupportedActionType } from '../types';
import { getBestSelectorForAction } from '../builders/selector';

import type { Action } from '../types';
import { ScriptType } from '../types';

import ActionListStyle from './ActionList.css';

function ActionListItem({
  action,
  stepNumber,
}: {
  action: Action;
  stepNumber: number;
}) {
  return (
    <div className="ActionListItem">
      <span>{stepNumber}. </span>
      {action.type === ActionType.Click ? (
        <>
          <span className="em-text">Click</span> on{' '}
          <span className="mono">
            {action.tagName === 'A' ? 'link' : action.tagName.toLowerCase()}
          </span>{' '}
          {(action.selectors.text?.length ?? -1) > 0 &&
          (action.selectors.text?.length ?? -1) < 75 ? (
            <span>"{action.selectors.text}"</span>
          ) : (
            <span className="mono">
              {getBestSelectorForAction(action, ScriptType.Playwright)}
            </span>
          )}
        </>
      ) : action.type === ActionType.Hover ? (
        <>
          <span className="em-text">Hover</span> over{' '}
          <span className="mono">
            {action.tagName === 'A' ? 'link' : action.tagName.toLowerCase()}
          </span>{' '}
          {(action.selectors.text?.length ?? -1) > 0 &&
          (action.selectors.text?.length ?? -1) < 75 ? (
            <span>"{action.selectors.text}"</span>
          ) : (
            <span className="mono">
              {getBestSelectorForAction(action, ScriptType.Playwright)}
            </span>
          )}
        </>
      ) : action.type === ActionType.Load ? (
        <>
          <span className="em-text">Load</span>{' '}
          <span className="mono">"{action.url}"</span>
        </>
      ) : action.type === ActionType.Input ? (
        <>
          <span className="em-text">Fill</span>{' '}
          <span className="mono">
            "
            {action.isPassword
              ? '*'.repeat(action?.value?.length ?? 0)
              : action.value}
            "
          </span>{' '}
          on{' '}
          <span className="mono">
            {getBestSelectorForAction(action, ScriptType.Playwright)}
          </span>
        </>
      ) : action.type === ActionType.Keydown ? (
        <>
          <span className="em-text">Press</span>{' '}
          <span className="mono">"{action.key}"</span> on{' '}
          <span className="mono">
            {getBestSelectorForAction(action, ScriptType.Playwright)}
          </span>
        </>
      ) : action.type === ActionType.Resize ? (
        <>
          <span className="em-text">Resize</span> <span>window to</span>{' '}
          <span className="mono">
            {action.width} x {action.height}
          </span>
        </>
      ) : action.type === ActionType.Wheel ? (
        <>
          <span className="em-text">Scroll wheel by </span>{' '}
          <span className="mono">
            X:{action.deltaX}, Y:{action.deltaY}
          </span>
        </>
      ) : action.type === ActionType.FullScreenshot ? (
        <>
          <span className="em-text">Take full page screenshot</span>
        </>
      ) : action.type === ActionType.AwaitText ? (
        <>
          <span className="em-text">Wait for text</span>
          <span>"{action.text}"</span>
        </>
      ) : action.type === ActionType.DragAndDrop ? (
        <>
          <span className="em-text">Drag n Drop</span> <span>from</span>{' '}
          <span className="mono">
            ({action.sourceX}, {action.sourceY})
          </span>{' '}
          <span>to</span>{' '}
          <span className="mono">
            ({action.targetX}, {action.targetY})
          </span>
        </>
      ) : (
        <></>
      )}
    </div>
  );
}

export default function ActionList({ actions }: { actions: Action[] }) {
  return (
    <>
      <style>{ActionListStyle}</style>
      <div className="ActionList" data-testid="action-list">
        {actions
          .filter((action) => isSupportedActionType(action.type))
          .map((action, i) => (
            <ActionListItem
              key={`${action.type}-${i}`}
              action={action}
              stepNumber={i + 1}
            />
          ))}
      </div>
    </>
  );
}
