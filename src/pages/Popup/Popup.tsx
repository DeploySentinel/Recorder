import React, { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSquare,
  faCircle,
  faCopy,
  faCheck,
  faChevronLeft,
} from '@fortawesome/free-solid-svg-icons';

import Logo from '../Common/Logo';
import CodeGen, { genCode } from '../Content/CodeGen';
import ActionList from '../Content/ActionList';
import { setEndRecordingStorage, localStorageGet } from '../Common/utils';

import PopupStyle from './Popup.css';
import type { Action } from '../Content/recorder';

async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

function LastStepPanel({
  actions,
  onBack,
}: {
  actions: Action[];
  onBack: () => void;
}) {
  const [showActionsMode, setShowActionsMode] = useState<
    'actions' | 'playwright' | 'puppeteer'
  >('playwright');
  const [copyCodeConfirm, setCopyCodeConfirm] = useState<boolean>(false);

  return (
    <div>
      <div>
        <span className="text-button text-sm" onClick={onBack}>
          <FontAwesomeIcon icon={faChevronLeft} /> Back
        </span>
      </div>
      <div className="d-flex justify-between mt-4 items-end text-sm">
        <div className="font-bold text-xl">
          Last Test{' '}
          {showActionsMode === 'actions' ? 'Actions' : 'Generated Code'}
        </div>
        <div>
          <span
            className="link-button"
            onClick={() => {
              setShowActionsMode(
                showActionsMode === 'actions' ? 'playwright' : 'actions'
              );
            }}
          >
            Show {showActionsMode === 'actions' ? 'Generated Code' : 'Actions'}
          </span>
        </div>
      </div>
      {(showActionsMode === 'playwright' ||
        showActionsMode === 'puppeteer') && (
        <div className="mt-4">
          <div className="d-flex justify-between items-end mb-4">
            <span
              className="text-sm link-button"
              onClick={() => {
                setShowActionsMode(
                  showActionsMode === 'playwright' ? 'puppeteer' : 'playwright'
                );
              }}
            >
              Switch to{' '}
              {showActionsMode === 'playwright' ? 'Puppeteer' : 'Playwright'}
            </span>
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
          </div>
          <CodeGen
            actions={actions}
            library={showActionsMode}
            styles={{ height: 400 }}
          />
        </div>
      )}
      {showActionsMode === 'actions' && (
        <div className="mt-4">
          <ActionList actions={actions} />
        </div>
      )}
    </div>
  );
}

const Popup = () => {
  const [recordingTabId, setRecordingTabId] = useState<number | null>(null);
  const [currentTabId, setCurrentTabId] = useState<number | null>(null);

  const [actions, setActions] = useState<Action[]>([]);

  const [isShowingLastTest, setIsShowingLastTest] = useState<boolean>(false);

  useEffect(() => {
    localStorageGet(['recording', 'recordingTabId']).then(
      ({ recording, recordingTabId }) => {
        setActions(recording || []);
        setRecordingTabId(recordingTabId || null);
      }
    );

    getCurrentTab().then((tab) => {
      const { id } = tab;
      setCurrentTabId(id ?? null);
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.recordingTabId != null) {
        setRecordingTabId(changes.recordingTabId.newValue);
      }
      if (changes.recording != null) {
        setActions(changes.recording.newValue);
      }
    });
  }, []);

  const onRecordNewTestClick = async () => {
    const currentTab = await getCurrentTab();
    const tabId = currentTab.id;

    if (tabId == null) {
      throw new Error('No tab id found');
    }

    // Let everyone know we should be recording with this current tab
    // Clear out event buffer
    chrome.storage.local.set({
      recordingState: 'active',
      recordingTabId: tabId,
      recording: [
        {
          type: 'load',
          url: currentTab.url,
        },
      ],
    });

    // Clean up existing instance in the tab if it exists
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        if (typeof window?.__DEPLOYSENTINEL_CLEAN_UP === 'function') {
          window.__DEPLOYSENTINEL_CLEAN_UP();
        }
      },
    });
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['contentScript.bundle.js'],
    });

    window.close();
  };

  const activePage =
    recordingTabId != null
      ? 'recording'
      : isShowingLastTest
      ? 'lastTest'
      : 'home';

  const isRecordingCurrentTab = currentTabId === recordingTabId;

  return (
    <>
      <style>{PopupStyle}</style>
      <div className="Popup" style={{ background: '#080A0B' }}>
        {activePage === 'recording' && (
          <>
            <Logo />
            <div className="text-center" style={{ marginTop: '2em' }}>
              <div className="text-xl text-red">
                Currently Recording
                {isRecordingCurrentTab ? ' Test...' : ' on Another Tab'}
              </div>
              {!isRecordingCurrentTab && recordingTabId != null && (
                <div className="mt-4">
                  <span
                    className="link-button"
                    onClick={() => {
                      chrome.tabs.update(recordingTabId, { active: true });
                    }}
                  >
                    Go To Active Recording Tab
                  </span>
                </div>
              )}
              <button
                className="btn-primary-outline m-4"
                style={{ marginTop: '2em' }}
                onClick={() => setEndRecordingStorage()}
                data-testid="end-test-recording"
              >
                <FontAwesomeIcon className="mr-1" icon={faSquare} />
                &nbsp; End Test Recording
              </button>
            </div>
          </>
        )}
        {activePage === 'home' && (
          <>
            <Logo />
            <div className="text-center mt-12">
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
                className="text-grey mt-6"
              >
                Generate a Playwright/Puppeteer test by just interacting with a
                site.
              </div>
              <button
                className="btn-primary mt-8"
                onClick={() => onRecordNewTestClick()}
                data-testid="record-new-test"
              >
                <FontAwesomeIcon
                  className="mr-1"
                  style={{ color: '#EA4240' }}
                  icon={faCircle}
                />
                &nbsp; Record a New Test
              </button>
              <div className="my-8">
                <span
                  className="link-button"
                  onClick={() => {
                    setIsShowingLastTest(true);
                  }}
                  data-testid="view-last-test"
                >
                  View Last Test Steps & Code
                </span>
              </div>
            </div>
          </>
        )}
        {activePage === 'lastTest' && (
          <LastStepPanel
            actions={actions}
            onBack={() => {
              setIsShowingLastTest(false);
            }}
          />
        )}
      </div>
    </>
  );
};

export default Popup;
