import React, { useEffect, useState } from 'react';

type StarProps = {
  filled: boolean;
  onClick: () => void;
};

const Star: React.FC<StarProps> = ({ filled, onClick }) => (
  <span
    onClick={onClick}
    style={{
      cursor: 'pointer',
      color: filled ? '#FFD700' : '#CCCCCC',
      fontSize: '24px',
    }}
  >
    ★
  </span>
);

type StarRatingProps = {
  userId: string;
  fountainId: string;
  jwtToken: string;
};

const StarRating: React.FC<StarRatingProps> = ({ userId, fountainId, jwtToken }) => {
  const [rating, setRating] = useState<number>(0);

  useEffect(() => {
    const fetchRating = async () => {
      const res = await fetch('/api/getUserRating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fountainId, jwtToken }),
      });

      const data = await res.json();
      if (data.rating != null) setRating(data.rating);
    };

    fetchRating();
  }, [userId, fountainId, jwtToken]);

  const submitRating = async (newRating: number) => {
    setRating(newRating);

    const res = await fetch('/api/rateWaterFountain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, fountainId, rating: newRating, jwtToken }),
    });

    const data = await res.json();
    if (data.error) {
      console.error('Rating failed:', data.error);
      alert('Failed to save rating.');
    }
  };

  return (
    <div>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} filled={star <= rating} onClick={() => submitRating(star)} />
      ))}
    </div>
  );
};

export default StarRating;
