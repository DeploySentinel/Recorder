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

import type { Action } from '../types';
import { ActionType, ActionsMode, ScriptType, TagName } from '../types';

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
      {action?.type === 'click'
        ? `Click on ${action.tagName.toLowerCase()} ${getBestSelectorForAction(
            action,
            ScriptType.Playwright
          )}`
        : action.type === 'hover'
        ? `Hover over ${action.tagName.toLowerCase()} ${getBestSelectorForAction(
            action,
            ScriptType.Playwright
          )}`
        : action?.type === 'input'
        ? `Fill "${
            action.isPassword
              ? '*'.repeat(action?.value?.length ?? 0)
              : action.value
          }" on ${action.tagName.toLowerCase()} ${getBestSelectorForAction(
            action,
            ScriptType.Playwright
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
        ? `Wait for text "${action.text}"`
        : ''}
    </>
  );
}

function isElementFromOverlay(element: HTMLElement) {
  if (element == null) return false;
  return element.closest('#overlay-controls') != null;
}

export default function ControlBar({ onExit }: { onExit: () => void }) {
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
  const [scriptType, setScriptType] = useState<ScriptType>(
    ScriptType.Playwright
  );

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
    setScriptType(ScriptType.Playwright);

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

      if (!isElementFromOverlay(elementMouseIsOver)) {
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
    ScriptType.Playwright
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
              label="End Test"
              onClick={() => onEndRecording()}
              testId="end-test"
            >
              <FontAwesomeIcon icon={faCheckCircle} size="2x" />
            </ActionButton>
            <div className="w-100 p-4">
              <div className="d-flex justify-between" style={{ fontSize: 14 }}>
                <div className="text-grey">Last Action</div>
                <div className="d-flex">
                  <div className="text-red">Recording</div>
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
                  {showAllActions ? 'Show Less' : 'Show More'}{' '}
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
                    <select
                      className="link-button mr-4"
                      style={{
                        backgroundColor: 'transparent',
                        color: 'white',
                        border: 'none',
                        outline: 'none',
                      }}
                      onChange={(e) =>
                        setScriptType(e.target.value as ScriptType)
                      }
                      value={scriptType}
                    >
                      <option value={ScriptType.Playwright}>
                        Playwright Library
                      </option>
                      <option value={ScriptType.Puppeteer}>
                        Puppeteer Library
                      </option>
                      <option value={ScriptType.Cypress}>
                        Cypress Library
                      </option>
                    </select>
                    <CopyToClipboard
                      text={genCode(actions, true, scriptType)}
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
              <CodeGen actions={actions} library={scriptType} />
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
