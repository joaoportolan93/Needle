import React from 'react';

const Button = ({ onClick, children, variant = 'primary', className = '' }) => {
  const baseStyle = 'px-4 py-2 rounded font-semibold focus:outline-none focus:ring-2 focus:ring-opacity-50';
  let variantStyle;

  switch (variant) {
    case 'secondary':
      variantStyle = 'bg-gray-500 hover:bg-gray-600 text-white';
      break;
    case 'danger':
      variantStyle = 'bg-red-500 hover:bg-red-600 text-white';
      break;
    case 'primary':
    default:
      variantStyle = 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-400'; // Cor verde vibrante como no esboço
      break;
  }

  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${variantStyle} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;

