import React from 'react';

export default function AppLogo({
  className = '',
  alt = 'NIT Kurukshetra logo',
}) {
  return (
    <img
      src={`${process.env.PUBLIC_URL}/nitkkr-logo.png`}
      alt={alt}
      className={className}
      loading="lazy"
      draggable={false}
    />
  );
}

