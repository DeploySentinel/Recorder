import React, { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSquare,
  faCircle,
  faInfoCircle,
  faCopy,
  faCheck,
  faChevronLeft,
} from '@fortawesome/free-solid-svg-icons';

import Logo from '../Common/Logo';
import CodeGen, { genCode } from '../Content/CodeGen';
import ActionList from '../Content/ActionList';
import {
  setStartRecordingStorage,
  localStorageGet,
  getCurrentTab,
  executeScript,
  executeCleanUp,
} from '../Common/utils';

import PopupStyle from './Popup.css';
import type { Action } from '../Content/recorder';
import { endRecording } from '../Common/endRecording';

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

  const [showBetaCTA, setShowBetaCTA] = useState<boolean>(
    localStorage.getItem('showBetaCta') !== 'false'
  );

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
      if (
        changes.recordingTabId != null &&
        changes.recordingTabId.newValue != changes.recordingTabId.oldValue
      ) {
        setRecordingTabId(changes.recordingTabId.newValue);
      }
      if (
        changes.recording != null &&
        changes.recording.newValue != changes.recording.oldValue
      ) {
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
    setStartRecordingStorage(tabId, currentTab.url || '');

    await executeCleanUp(tabId);
    await executeScript(tabId, 'contentScript.bundle.js');

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
                      window.close();
                    }}
                  >
                    Go To Active Recording Tab
                  </span>
                </div>
              )}
              <button
                className="btn-primary-outline m-4"
                style={{ marginTop: '2em' }}
                onClick={() => endRecording()}
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
            <div className="d-flex justify-between items-center">
              <Logo />
              <div>
                <a
                  href="https://www.deploysentinel.com/docs/recorder"
                  target="_blank"
                  className="text-button text-decoration-none text-sm text-grey"
                >
                  <FontAwesomeIcon icon={faInfoCircle} className="mr-1" /> Docs
                </a>
              </div>
            </div>
            <div className="text-center mt-12">
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
                className="text-grey mt-6"
              >
                Generate Playwright & Puppeteer scripts from your browser
                actions (ex. click, type, scroll).
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
                &nbsp; Start Recording from Current Tab
              </button>
              <div className="my-8">
                <span
                  className="link-button"
                  onClick={() => {
                    setIsShowingLastTest(true);
                  }}
                  data-testid="view-last-test"
                >
                  View Last Recording
                </span>
              </div>
              {showBetaCTA && (
                <div
                  style={{ background: '#2e273b' }}
                  className="rounded p-3 text-left mt-12"
                >
                  <div className="fw-bold">
                    Join the free DeploySentinel Beta
                  </div>
                  <div className="mt-4" style={{ lineHeight: '1.5rem' }}>
                    Monitor your site 24/7 and get alerted on issues by
                    deploying Playwright tests on DeploySentinel.
                  </div>
                  <div className="mt-4">
                    <a
                      href="https://deploysentinel.com?utm_source=rcd&utm_medium=bnr"
                      target="_blank"
                      className="link-button text-decoration-none fw-bold mr-5"
                    >
                      Learn More
                    </a>
                    <span
                      className="text-button text-grey"
                      onClick={() => {
                        localStorage?.setItem('showBetaCta', 'false');
                        setShowBetaCTA(false);
                      }}
                      data-testid="view-last-test"
                    >
                      No Thanks
                    </span>
                  </div>
                </div>
              )}
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
