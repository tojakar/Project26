// SearchFountain.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchFountain from '../components/SearchFountain';
import axios from 'axios';
import * as tokenStorage from '../tokenStorage';

// Mock axios to prevent actual API calls during tests
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the tokenStorage module
jest.mock('../tokenStorage', () => ({
  retrieveToken: jest.fn(),
  storeToken: jest.fn(),
}));

const mockRetrieveToken = tokenStorage.retrieveToken as jest.MockedFunction<typeof tokenStorage.retrieveToken>;

describe('SearchFountain Component Tests', () => {
  const mockOnResults = jest.fn();
  const mockOnClear = jest.fn();
  const mockShowStatus = jest.fn();

  const defaultProps = {
    onResults: mockOnResults,
    onClear: mockOnClear,
    showStatus: mockShowStatus,
    isSearchActive: false,
    searchResultsCount: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock token retrieval to return a valid token
    mockRetrieveToken.mockReturnValue('mock-token');
  });

  test('renders search input and button correctly', () => {
    render(<SearchFountain {...defaultProps} />);

    // Check that search elements are present
    expect(screen.getByPlaceholderText(/search fountains/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  test('handles successful fountain search', async () => {
    // Mock successful search response
    const mockFountains = [
      { _id: '1', name: 'Campus Fountain', description: 'Main campus fountain', createdBy: 'user1', xCoord: 0, yCoord: 0, filterLevel: 5, rating: 4 },
      { _id: '2', name: 'Library Fountain', description: 'Near the library', createdBy: 'user2', xCoord: 1, yCoord: 1, filterLevel: 4, rating: 5 }
    ];

    mockedAxios.post.mockResolvedValueOnce({
      data: { found: mockFountains }
    });

    render(<SearchFountain {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search fountains/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    // Search for fountains
    fireEvent.change(searchInput, { target: { value: 'Campus' } });
    fireEvent.click(searchButton);

    // Wait for the API call and results
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('api/searchWaterFountainByName'),
        { name: 'Campus', jwtToken: 'mock-token' },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );
    });

    await waitFor(() => {
      expect(mockOnResults).toHaveBeenCalledWith(mockFountains);
    });
  });

  test('handles search without token gracefully', async () => {
    // Mock no token available
    mockRetrieveToken.mockReturnValue(null);

    render(<SearchFountain {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search fountains/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    // Search without being logged in
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    fireEvent.click(searchButton);

    // Wait for the error message
    await waitFor(() => {
      expect(mockShowStatus).toHaveBeenCalledWith('Please log in to search fountains.', 'error');
    });

    // Ensure no API call was made
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});
