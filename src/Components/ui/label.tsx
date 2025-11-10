import React from 'react';
import './label.css';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export function Label({ className = '', children, ...props }: LabelProps) {
  return (
    <label className={`label ${className}`} {...props}>
      {children}
    </label>
  );
}

