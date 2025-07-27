import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
        const currentToken = retrieveToken() || jwtToken;

        const response = await axios.post(buildPath('api/getUserRating'), {
          userId,
          fountainId,
          jwtToken: currentToken,
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        });

        const data = response.data;

        if (data.jwtToken) {
          const token = typeof data.jwtToken === 'string'
            ? data.jwtToken
            : data.jwtToken.accessToken;
          storeToken({ accessToken: token });
        }

        if (data.rating != null) setRating(data.rating);
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          console.error('Error fetching rating:', error.response?.data || error.message);
        } else {
          console.error('Unexpected error fetching rating:', error);
        }
      }
    };

    fetchRating();
  }, [userId, fountainId, jwtToken]);

 const submitRating = async (newRating: number) => {
    setRating(newRating);

    try {
      const currentToken = retrieveToken() || jwtToken;

      const response = await axios.post(buildPath('api/rateWaterFountain'), {
        userId,
        fountainId,
        rating: newRating,
        jwtToken: currentToken,
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      const data = response.data;

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

      // ★ Dispatch the update event so the map popup can update its static text:
      window.dispatchEvent(new CustomEvent('starRated', {
        detail: { fountainId, newRating: data.averageRating }
      }));

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error('Error submitting rating:', error.response?.data || error.message);
        alert('Failed to save rating: ' + (error.response?.data?.error || error.message));
      } else {
        alert('Failed to save rating: ' + error);
      }
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