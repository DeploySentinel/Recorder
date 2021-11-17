import React, { useState, useEffect, useRef } from 'react';
import throttle from 'lodash.throttle';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCopy,
  faCheck,
  faCheckCircle,
  faTimes,
  faChevronUp,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';

import genSelectors, { getBestSelectorForAction } from './selector';
import Recorder from './recorder';
import Highlighter from './Highlighter';
import ActionList from './ActionList';
import CodeGen, { genCode } from './CodeGen';

import type { Action } from './recorder';

import ControlBarStyle from './ControlBar.css';

const ActionButton = ({
  onClick,
  children,
  label,
}: {
  onClick: () => void;
  children: JSX.Element;
  label: String;
}) => (
  <div className="ActionButton" onClick={onClick}>
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
            action
          )}`
        : action.type === 'hover'
        ? `Hover over ${action.tagName.toLowerCase()} ${getBestSelectorForAction(
            action
          )}`
        : action?.type === 'input'
        ? `Fill "${
            action.isPassword
              ? '*'.repeat(action?.value?.length ?? 0)
              : action.value
          }" on ${action.tagName.toLowerCase()} ${getBestSelectorForAction(
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
  const [showActionsMode, setShowActionsMode] = useState<
    'actions' | 'playwright' | 'puppeteer'
  >('playwright');
  const [copyCodeConfirm, setCopyCodeConfirm] = useState<boolean>(false);

  const [isFinished, setIsFinished] = useState<boolean>(false);

  const [isOpen, setIsOpen] = useState<boolean>(true);

  const handleMouseMoveRef = useRef((_: MouseEvent) => {});
  const recorderRef = useRef<Recorder | null>(null);

  const onEndRecording = () => {
    setIsFinished(true);

    // Show Code
    setShowAllActions(true);
    setShowActionsMode('playwright');

    // Clear out highlighter
    document.removeEventListener('mousemove', handleMouseMoveRef.current, true);
    setHoveredElement(null);

    // Turn off recorder
    recorderRef.current?.deregister();
    chrome.storage.local.set({
      recordingState: 'finished',
      recordingTabId: null,
    });
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
        setHoveredElement(elementMouseIsOver || null);
        setHoveredElementSelectors(genSelectors(elementMouseIsOver));
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
        changes.recordingState.newValue === 'finished'
      ) {
        if (!isFinished) {
          onEndRecording();
        }
      }
    });
  }, []);

  const rect = hoveredElement?.getBoundingClientRect();
  const displayedSelector = getBestSelectorForAction({
    type: 'click',
    tagName: hoveredElement?.tagName ?? '',
    value: undefined,
    selectors: hoveredElementSelectors || {},
    timestamp: 0,
    isPassword: false,
  });

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
                <span className="mr-2">Recording Finished!</span>🎉
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
            <ActionButton label="End Test" onClick={() => onEndRecording()}>
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
                  onClick={() => setShowAllActions(!showAllActions)}
                >
                  {showAllActions ? 'Hide' : 'See'} Prior Steps{' '}
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
                  onClick={() => {
                    setShowActionsMode(
                      showActionsMode === 'actions' ? 'playwright' : 'actions'
                    );
                  }}
                >
                  Show{' '}
                  {showActionsMode === 'actions' ? 'Generated Code' : 'Actions'}
                </span>
                {(showActionsMode === 'playwright' ||
                  showActionsMode === 'puppeteer') && (
                  <span
                    className="text-sm link-button mb-4"
                    onClick={() => {
                      setShowActionsMode(
                        showActionsMode === 'playwright'
                          ? 'puppeteer'
                          : 'playwright'
                      );
                    }}
                  >
                    Switch to{' '}
                    {showActionsMode === 'playwright'
                      ? 'Puppeteer'
                      : 'Playwright'}
                  </span>
                )}
              </div>
              <div>
                {(showActionsMode === 'playwright' ||
                  showActionsMode === 'puppeteer') && (
                  <CopyToClipboard
                    text={genCode(actions, true, showActionsMode)}
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
                )}
              </div>
            </div>

            {(showActionsMode === 'playwright' ||
              showActionsMode === 'puppeteer') && (
              <CodeGen actions={actions} library={showActionsMode} />
            )}
            {showActionsMode === 'actions' && <ActionList actions={actions} />}
          </div>
        )}
      </div>
    </>
  );
}
