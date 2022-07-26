import React, { useState, useEffect, useRef } from 'react';
import throttle from 'lodash.throttle';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCamera,
  faCopy,
  faCheck,
  faCheckCircle,
  faTimes,
  faChevronUp,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';

import Recorder from './recorder';
import Highlighter from './Highlighter';
import ActionList from './ActionList';
import CodeGen from './CodeGen';
import genSelectors, { getBestSelectorForAction } from '../builders/selector';
import { genCode } from '../builders';
import ScriptTypeSelect from '../Common/ScriptTypeSelect';
import { usePreferredLibrary, usePreferredBarPosition } from '../Common/hooks';

import type { Action } from '../types';
import {
  ActionType,
  ActionsMode,
  ScriptType,
  TagName,
  BarPosition,
} from '../types';

import ControlBarStyle from './ControlBar.css';
import { endRecording } from '../Common/endRecording';

const ActionButton = ({
  onClick,
  children,
  label,
  testId,
}: {
  onClick: () => void;
  children: JSX.Element;
  label: String;
  testId?: String;
}) => (
  <div className="ActionButton" onClick={onClick} data-testid={testId}>
    <div>
      <div
        style={{
          height: 32,
          width: 32,
          position: 'relative',
          margin: '0 auto',
          marginBottom: '0.5em',
        }}
      >
        {children}
      </div>
      <div style={{ fontSize: 12, marginTop: 4 }}>{label}</div>
    </div>
  </div>
);

function RenderActionText({ action }: { action: Action }) {
  return (
    <>
      {action.type === ActionType.Click
        ? `Click on ${action.tagName.toLowerCase()} ${getBestSelectorForAction(
            action,
            ScriptType.Playwright
          )}`
        : action.type === ActionType.Hover
        ? `Hover over ${action.tagName.toLowerCase()} ${getBestSelectorForAction(
            action,
            ScriptType.Playwright
          )}`
        : action.type === ActionType.Input
        ? `Fill "${
            action.isPassword
              ? '*'.repeat(action?.value?.length ?? 0)
              : action.value
          }" on ${action.tagName.toLowerCase()} ${getBestSelectorForAction(
            action,
            ScriptType.Playwright
          )}`
        : action.type === ActionType.Keydown
        ? `Press ${action.key} on ${action.tagName.toLowerCase()}`
        : action.type === ActionType.Load
        ? `Load "${action.url}"`
        : action.type === ActionType.Resize
        ? `Resize window to ${action.width} x ${action.height}`
        : action.type === ActionType.Wheel
        ? `Scroll wheel by X:${action.deltaX}, Y:${action.deltaY}`
        : action.type === ActionType.FullScreenshot
        ? `Take full page screenshot`
        : action.type === ActionType.AwaitText
        ? `Wait for text "${action.text}"`
        : action.type === ActionType.DragAndDrop
        ? `Drag n Drop from (${action.sourceX}, ${action.sourceY}) to (${action.targetX}, ${action.targetY})`
        : ''}
    </>
  );
}

function isElementFromOverlay(element: HTMLElement) {
  if (element == null) return false;
  return element.closest('#overlay-controls') != null;
}

export default function ControlBar({ onExit }: { onExit: () => void }) {
  const [barPosition, setBarPosition] = usePreferredBarPosition(
    BarPosition.Bottom
  );

  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(
    null
  );
  const [hoveredElementSelectors, setHoveredElementSelectors] = useState<any>(
    {}
  );

  const [lastAction, setLastAction] = useState<Action | null>(null);
  const [actions, setActions] = useState<Action[]>([]);

  const [showAllActions, setShowAllActions] = useState<boolean>(false);
  const [showActionsMode, setShowActionsMode] = useState<ActionsMode>(
    ActionsMode.Code
  );
  const [preferredLibrary, setPreferredLibrary] = usePreferredLibrary();

  const [copyCodeConfirm, setCopyCodeConfirm] = useState<boolean>(false);
  const [screenshotConfirm, setScreenshotConfirm] = useState<boolean>(false);

  const [isFinished, setIsFinished] = useState<boolean>(false);

  const [isOpen, setIsOpen] = useState<boolean>(true);

  const handleMouseMoveRef = useRef((_: MouseEvent) => {});
  const recorderRef = useRef<Recorder | null>(null);

  const onEndRecording = () => {
    setIsFinished(true);

    // Show Code
    setShowAllActions(true);

    // Clear out highlighter
    document.removeEventListener('mousemove', handleMouseMoveRef.current, true);
    setHoveredElement(null);

    // Turn off recorder
    recorderRef.current?.deregister();

    endRecording();
  };

  const onClose = () => {
    setIsOpen(false);
    onExit();
  };

  useEffect(() => {
    handleMouseMoveRef.current = throttle((event: MouseEvent) => {
      const x = event.clientX,
        y = event.clientY,
        elementMouseIsOver = document.elementFromPoint(x, y) as HTMLElement;

      if (
        !isElementFromOverlay(elementMouseIsOver) &&
        elementMouseIsOver != null
      ) {
        const { parentElement } = elementMouseIsOver;
        // Match the logic in recorder.ts for link clicks
        const element =
          parentElement?.tagName === 'A' ? parentElement : elementMouseIsOver;
        setHoveredElement(element || null);
        setHoveredElementSelectors(genSelectors(element));
      }
    }, 100);

    document.addEventListener('mousemove', handleMouseMoveRef.current, true);

    recorderRef.current = new Recorder({
      onAction: (action: Action, actions: Action[]) => {
        setLastAction(action);
        setActions(actions);
      },
      onInitialized: (lastAction: Action, recording: Action[]) => {
        setLastAction(
          recording.reduceRight<Action | null>(
            (p, v) => (p == null && v.type != 'navigate' ? v : p),
            null
          )
        );
        setActions(recording);
      },
    });

    // Set recording to be finished if somewhere else (ex. popup) the state has been set to be finished
    chrome.storage.onChanged.addListener((changes) => {
      if (
        changes.recordingState != null &&
        changes.recordingState.newValue === 'finished' &&
        // Firefox will fire change events even if the values are not changed
        changes.recordingState.newValue !== changes.recordingState.oldValue
      ) {
        if (!isFinished) {
          onEndRecording();
        }
      }
    });
  }, []);

  const displayedScriptType = preferredLibrary ?? ScriptType.Cypress;

  const rect = hoveredElement?.getBoundingClientRect();
  const displayedSelector = getBestSelectorForAction(
    {
      type: ActionType.Click,
      tagName: (hoveredElement?.tagName ?? '') as TagName,
      inputType: undefined,
      value: undefined,
      selectors: hoveredElementSelectors || {},
      timestamp: 0,
      isPassword: false,
      hasOnlyText:
        hoveredElement?.children?.length === 0 &&
        hoveredElement?.innerText?.length > 0,
    },
    displayedScriptType
  );

  if (isOpen === false) {
    return <> </>;
  }

  return (
    <>
      <style>{ControlBarStyle}</style>
      {rect != null && rect.top != null && (
        <Highlighter rect={rect} displayedSelector={displayedSelector ?? ''} />
      )}
      <div
        className="ControlBar rr-ignore"
        id="overlay-controls"
        style={{
          ...(barPosition === BarPosition.Bottom
            ? {
                bottom: 35,
              }
            : { top: 35 }),
          height: showAllActions ? 330 : 100,
        }}
      >
        {isFinished ? (
          <div className="p-4">
            <div className="d-flex justify-between mb-2">
              <div className="text-xl">
                <span className="mr-2" data-testid="recording-finished">
                  Recording Finished!
                </span>
                🎉
              </div>
              <div className="text-button" onClick={() => onClose()}>
                <FontAwesomeIcon icon={faTimes} size="sm" />
              </div>
            </div>
            <div className="d-flex justify-between items-center">
              <div className="text-sm text-grey">
                Below is the generated code for this recording.
              </div>
              <div className="d-flex">
                <div
                  className="text-sm link-button"
                  onClick={() => setShowAllActions(!showAllActions)}
                >
                  {showAllActions ? 'Collapse' : 'See'} Recording Steps{' '}
                  <FontAwesomeIcon
                    icon={showAllActions ? faChevronUp : faChevronDown}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="d-flex items-center">
            <ActionButton
              label="End Rec"
              onClick={() => onEndRecording()}
              testId="end-test"
            >
              <FontAwesomeIcon icon={faCheckCircle} size="2x" />
            </ActionButton>
            <div className="w-100 p-4">
              <div className="d-flex justify-between" style={{ fontSize: 14 }}>
                <div className="text-grey">Last Action</div>
                <div
                  className="text-grey text-sm text-button"
                  onClick={() =>
                    setBarPosition(
                      barPosition === BarPosition.Bottom
                        ? BarPosition.Top
                        : BarPosition.Bottom
                    )
                  }
                >
                  Move Overlay to{' '}
                  {barPosition === BarPosition.Bottom ? 'Top' : 'Bottom'}
                </div>
              </div>
              <div
                className="d-flex justify-between items-end"
                style={{ marginTop: 12 }}
              >
                <div className="last-action-preview">
                  {lastAction != null && (
                    <RenderActionText action={lastAction} />
                  )}
                </div>
                <div
                  className="text-sm link-button"
                  data-testid={
                    showAllActions ? 'show-less-actions' : 'show-more-actions'
                  }
                  onClick={() => setShowAllActions(!showAllActions)}
                >
                  {showAllActions ? 'Collapse Overlay' : 'Expand Overlay'}{' '}
                  <FontAwesomeIcon
                    icon={showAllActions ? faChevronUp : faChevronDown}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {showAllActions && (
          <div className="actions-wrapper p-4" style={{}}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="mb-4">
                <span
                  className="text-sm link-button mr-2"
                  data-testid={`show-${
                    showActionsMode === ActionsMode.Actions
                      ? ActionsMode.Code
                      : ActionsMode.Actions
                  }`}
                  onClick={() => {
                    setShowActionsMode(
                      showActionsMode === ActionsMode.Actions
                        ? ActionsMode.Code
                        : ActionsMode.Actions
                    );
                  }}
                >
                  Show{' '}
                  {showActionsMode === ActionsMode.Actions ? 'Code' : 'Actions'}
                </span>
                {!isFinished && (
                  <span
                    className={`text-sm link-button mr-2 ${
                      screenshotConfirm ? 'text-green' : ''
                    }`}
                    data-testid="record-screenshot"
                    onClick={() => {
                      recorderRef.current?.onFullScreenshot();
                      setScreenshotConfirm(true);
                      setTimeout(() => {
                        setScreenshotConfirm(false);
                      }, 2000);
                    }}
                  >
                    <FontAwesomeIcon
                      icon={screenshotConfirm ? faCheck : faCamera}
                      size="sm"
                    />{' '}
                    Record Screenshot
                  </span>
                )}
              </div>
              <div>
                {showActionsMode === ActionsMode.Code && (
                  <>
                    <ScriptTypeSelect
                      value={displayedScriptType}
                      onChange={setPreferredLibrary}
                    />
                    <CopyToClipboard
                      text={genCode(actions, true, displayedScriptType)}
                      onCopy={() => {
                        setCopyCodeConfirm(true);
                        setTimeout(() => {
                          setCopyCodeConfirm(false);
                        }, 2000);
                      }}
                    >
                      <span
                        className={`text-sm link-button ${
                          copyCodeConfirm ? 'text-green' : ''
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={copyCodeConfirm ? faCheck : faCopy}
                          size="sm"
                        />{' '}
                        Copy Code
                      </span>
                    </CopyToClipboard>
                  </>
                )}
              </div>
            </div>

            {showActionsMode === ActionsMode.Code && (
              <CodeGen actions={actions} library={displayedScriptType} />
            )}
            {showActionsMode === ActionsMode.Actions && (
              <ActionList actions={actions} />
            )}
          </div>
        )}
      </div>
    </>
  );
}
