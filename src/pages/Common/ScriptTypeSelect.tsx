import React, { useEffect, useState } from 'react';
import { ScriptType } from '../types';

export default function ScriptTypeSelect({
  value,
  onChange,
  color,
  fontSize,
  shortDescription,
}: {
  value: ScriptType;
  onChange: (val: ScriptType) => void;
  color?: string;
  fontSize?: number;
  shortDescription?: boolean;
}) {
  return (
    <select
      className="link-button mr-4"
      style={{
        backgroundColor: '#080a0b',
        color: color ?? 'white',
        border: 'none',
        outline: 'none',
        fontSize,
      }}
      onChange={(e) => onChange(e.target.value as ScriptType)}
      value={value}
      data-testid="script-type-select"
    >
      <option value={ScriptType.Playwright}>
        Playwright{!shortDescription ? ' Library' : ''}
      </option>
      <option value={ScriptType.Puppeteer}>
        Puppeteer{!shortDescription ? ' Library' : ''}
      </option>
      <option value={ScriptType.Cypress}>
        Cypress{!shortDescription ? ' Library' : ''}
      </option>
    </select>
  );
}
