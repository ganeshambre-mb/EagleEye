import React from 'react';
import './input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`input ${className}`}
      {...props}
    />
  );
}

