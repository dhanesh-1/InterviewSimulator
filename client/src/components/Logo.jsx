import React from 'react';
import PropTypes from 'prop-types';

export default function Logo({ height = 28, showText = true }) {
  return (
    <div 
      className="brand-logo-container" 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '0.65rem',
        userSelect: 'none'
      }}
    >
      <svg
        width={height * 1.1}
        height={height}
        viewBox="0 0 44 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Left dot */}
        <circle cx="10" cy="18" r="5.5" fill="#2563eb" />
        {/* Right diagonal pill */}
        <path
          d="M17 30L29 10"
          stroke="#2563eb"
          strokeWidth="8.5"
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <span 
          className="brand-logo-text" 
          style={{
            fontWeight: 800,
            fontSize: `${height * 0.72}px`,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            fontFamily: 'var(--font-family)',
            lineHeight: 1
          }}
        >
          HireReady
        </span>
      )}
    </div>
  );
}

Logo.propTypes = {
  height: PropTypes.number,
  showText: PropTypes.bool,
};
