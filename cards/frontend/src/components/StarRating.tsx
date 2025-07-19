import React, { useEffect, useState } from 'react';
import { buildPath } from './Path';
import { retrieveToken, storeToken } from '../tokenStorage';

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
      try {
        const currentToken = retrieveToken();
        const res = await fetch(buildPath('api/getUserRating'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            fountainId,
            jwtToken: currentToken || jwtToken
          }),
        });

        const data = await res.json();

        if (data.jwtToken) {
          const token = typeof data.jwtToken === 'string'
            ? data.jwtToken
            : data.jwtToken.accessToken;
          storeToken({ accessToken: token });
        }

        if (data.rating != null) setRating(data.rating);
      } catch (error) {
        console.error(error);
      }
    };

    fetchRating();
  }, [userId, fountainId, jwtToken]);

  const submitRating = async (newRating: number) => {
    setRating(newRating);

    try {
      const currentToken = retrieveToken();
      const res = await fetch(buildPath('api/rateWaterFountain'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          fountainId,
          rating: newRating,
          jwtToken: currentToken || jwtToken
        }),
      });

      const data = await res.json();

      if (data.jwtToken) {
        const token = typeof data.jwtToken === 'string'
          ? data.jwtToken
          : data.jwtToken.accessToken;
        storeToken({ accessToken: token });
      }

      if (data.error) {
        alert('Failed to save rating: ' + data.error);
        return;
      }

      if (data.success) {
      }
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          filled={star <= rating}
          onClick={() => submitRating(star)}
        />
      ))}
    </div>
  );
};

export default StarRating;
