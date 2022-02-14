import React from 'react';

export default function Logo() {
  return (
    <a
      href="https://www.deploysentinel.com?utm_source=rcd&utm_medium=logo"
      target="_blank"
      className="text-decoration-none"
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 18,
          color: 'white',
          font: 'Roboto',
          userSelect: 'none',
        }}
      >
        DeploySentinel
      </div>
    </a>
  );
}
