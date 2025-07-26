import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { buildPath } from './Path';

interface Props {
  userId: string;
  fountainId: string;
  jwtToken: string;
}

const FilterLevelRating: React.FC<Props> = ({ userId, fountainId, jwtToken }) => {
  const [filterLevel, setFilterLevel] = useState<number>(0);

  useEffect(() => {
    const fetchUserFilterLevel = async () => {
      try {
        const res = await axios.post(buildPath('api/getUserFilterLevel'), {
          userId,
          fountainId,
          jwtToken,
        });

        if (res.data.filterLevel) {
          setFilterLevel(res.data.filterLevel);
        }
      } catch (err) {
        console.error('Error fetching filter level', err);
      }
    };

    fetchUserFilterLevel();
  }, [userId, fountainId, jwtToken]);

    const handleClick = async (level: number) => {
    setFilterLevel(level); // optimistic UI

    try {
        const currentToken = jwtToken;  // if you’re refreshing tokens here

        const response = await axios.post(buildPath('api/rateFilterLevel'), {
        userId,
        fountainId,
        filterLevel: level,
        jwtToken: currentToken,
        }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
        });

        const data = response.data;
        // if your API returns a refreshed token:
        if (data.jwtToken) {
        const tok = typeof data.jwtToken === 'string'
            ? data.jwtToken
            : data.jwtToken.accessToken;
        }
        if (data.error) {
        console.error('Rating error:', data.error);
        return;
        }

        window.dispatchEvent(new CustomEvent('filterRated', {
        detail: {
            fountainId,
            newLevel: data.averageFilterLevel
        }
        }));

    } catch (err) {
        console.error('Failed to rate filter level', err);
        // optionally rollback optimistic update: setFilterLevel(prev)…
    }
    };

  

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[1, 2, 3].map((level) => (
          <span
            key={level}
            onClick={() => handleClick(level)}
            style={{
              cursor: 'pointer',
              color: level <= filterLevel ? '#1650eeff' : '#CCCCCC',
              fontSize: '15px',
              padding: '2px 6px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              userSelect: 'none',
              fontWeight: 'bold',
              minWidth: '15px',
              textAlign: 'center',
            }}
          >
            {level}
          </span>
        ))}
      </div>
    </div>
  );
};

export default FilterLevelRating;