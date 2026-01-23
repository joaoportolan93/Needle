import React from 'react';

const Card = ({ children, className = '' }) => {
  const cardStyle = 'bg-gray-700 p-4 rounded-lg shadow-lg'; // Cor de fundo escura, conforme esboço

  return (
    <div className={`${cardStyle} ${className}`}>
      {children}
    </div>
  );
};

export default Card;

