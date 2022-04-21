import React, { useEffect, useState } from 'react';

import {
  setPreferredLibraryStorage,
  setPreferredBarPositionStorage,
  localStorageGet,
} from './utils';
import { ScriptType, BarPosition } from '../types';

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
