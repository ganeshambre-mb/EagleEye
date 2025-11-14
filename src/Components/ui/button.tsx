import React from 'react';
import './button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
  size?: 'default' | 'icon';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'default', 
  size = 'default', 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

