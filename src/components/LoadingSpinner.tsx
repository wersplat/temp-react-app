import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

/**
 * A loading spinner component with different size options
 * @param {LoadingSpinnerProps} props - Component props
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Size of the spinner
 * @param {string} [props.className=''] - Additional CSS classes
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
}) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div
      className={`animate-spin rounded-full border-b-2 border-indigo-500 ${sizeMap[size]}`}
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);

export default LoadingSpinner;
