import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const buttonVariants = {
  default: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600',
  outline: 'bg-transparent text-blue-600 border-blue-600 hover:bg-blue-50',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-300',
  destructive: 'bg-red-600 text-white hover:bg-red-700 border-red-600',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 border-transparent',
};

const buttonSizes = {
  default: 'px-4 py-2 text-sm',
  sm: 'px-3 py-1.5 text-xs',
  lg: 'px-6 py-3 text-base',
};

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'default',
  size = 'default',
  className = '',
  onClick,
  disabled = false,
  type = 'button'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center rounded-md border font-medium
        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${buttonVariants[variant]}
        ${buttonSizes[size]}
        ${className}
      `}
    >
      {children}
    </button>
  );
};
