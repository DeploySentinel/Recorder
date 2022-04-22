import React, { useEffect, useState } from 'react';

import {
  setPreferredLibraryStorage,
  setPreferredBarPositionStorage,
  localStorageGet,
} from './utils';
import { ScriptType, BarPosition } from '../types';

import type { Action } from '../types';

export function usePreferredLibrary() {
  const [preferredLibrary, setPreferredLibrary] = useState<ScriptType | null>(
    null
  );

  useEffect(() => {
    localStorageGet(['preferredLibrary']).then(
      ({ preferredLibrary: storedPreferredLibrary }) => {
        setPreferredLibrary(storedPreferredLibrary);
      }
    );
  }, []);

  const setPreferredLibraryWithStorage = (library: ScriptType) => {
    setPreferredLibrary(library);
    setPreferredLibraryStorage(library);
  };

  return [preferredLibrary, setPreferredLibraryWithStorage] as const;
}

export function usePreferredBarPosition(defaultPosition: BarPosition) {
  const [preferredBarPosition, setPreferredBarPosition] =
    useState<BarPosition | null>(defaultPosition);

  useEffect(() => {
    localStorageGet(['preferredBarPosition']).then(
      ({ preferredBarPosition: storedPreferredBarPosition }) => {
        setPreferredBarPosition(storedPreferredBarPosition ?? defaultPosition);
      }
    );
  }, []);

  const setPreferredBarPositionWithStorage = (barPosition: BarPosition) => {
    setPreferredBarPosition(barPosition);
    setPreferredBarPositionStorage(barPosition);
  };

  return [preferredBarPosition, setPreferredBarPositionWithStorage] as const;
}

export function useRecordingState() {
  const [recordingTabId, setRecordingTabId] = useState<number | null>(null);
  const [actions, setActions] = useState<Action[]>([]);

  useEffect(() => {
    localStorageGet(['recording', 'recordingTabId']).then(
      ({ recording, recordingTabId }) => {
        setActions(recording ?? []);
        setRecordingTabId(recordingTabId ?? null);
      }
    );

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

  return [recordingTabId, actions] as const;
}
