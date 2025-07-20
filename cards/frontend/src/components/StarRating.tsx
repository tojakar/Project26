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

        if (!res.ok) {
          console.error(`HTTP error! status: ${res.status}`);
          return;
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Expected JSON response but got:', contentType);
          return;
        }

        const data = await res.json();

        if (data.jwtToken) {
          const token = typeof data.jwtToken === 'string'
            ? data.jwtToken
            : data.jwtToken.accessToken;
          storeToken({ accessToken: token });
        }

        if (data.rating != null) setRating(data.rating);
      } catch (error) {
        console.error('Error fetching rating:', error);
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

      if (!res.ok) {
        console.error(`HTTP error! status: ${res.status}`);
        alert('Failed to save rating: Server error');
        return;
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Expected JSON response but got:', contentType);
        alert('Failed to save rating: Invalid response format');
        return;
      }

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
        // Rating saved successfully
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to save rating: ' + error);
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
