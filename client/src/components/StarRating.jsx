import React from 'react';
import { FiStar } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';

const StarRating = ({ rating = 0, max = 5, size = 14, interactive = false, onChange }) => {
  const renderStar = (index) => {
    const filled = rating >= index + 1;
    const half = !filled && rating >= index + 0.5;

    if (interactive) {
      return (
        <FiStar
          key={index}
          size={size}
          style={{
            cursor: 'pointer',
            color: filled || half ? '#FF5A5F' : '#DDDDDD',
            fill: filled ? '#FF5A5F' : 'none',
            transition: 'all 0.1s',
          }}
          onClick={() => onChange && onChange(index + 1)}
        />
      );
    }

    if (filled) return <FaStar key={index} size={size} style={{ color: '#FF5A5F' }} />;
    if (half) return <FaStarHalfAlt key={index} size={size} style={{ color: '#FF5A5F' }} />;
    return <FaStar key={index} size={size} style={{ color: '#DDDDDD' }} />;
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: max }, (_, i) => renderStar(i))}
    </span>
  );
};

export default StarRating;
