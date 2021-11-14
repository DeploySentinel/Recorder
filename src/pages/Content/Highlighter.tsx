import React from 'react';

import HighlighterStyle from './Highlighter.css';

type Props = {
  rect: DOMRect;
  displayedSelector: string;
};

export default function Highlighter({ rect, displayedSelector }: Props) {
  return (
    <>
      <style>{HighlighterStyle}</style>
      <div
        id="Highlighter-outline"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      ></div>
      <div
        id="Highlighter-label"
        style={{
          top: rect.top + rect.height + 8,
          left: rect.left,
        }}
      >
        {displayedSelector}
      </div>
    </>
  );
}
