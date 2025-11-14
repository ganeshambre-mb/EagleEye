import React from 'react';
import './progress.css';

interface ProgressProps {
  value: number;
}

export function Progress({ value }: ProgressProps) {
  return (
    <div className="progress-container">
      <div 
        className="progress-bar" 
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

