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
const mockStoreToken = tokenStorage.storeToken as jest.MockedFunction<typeof tokenStorage.storeToken>;

describe('SearchFountain Component Tests', () => {
  const mockOnResults = jest.fn();
  const mockShowStatus = jest.fn();
  const mockOnClear = jest.fn();

  const defaultProps = {
    onResults: mockOnResults,
    showStatus: mockShowStatus,
    onClear: mockOnClear,
    isSearchActive: false,
    searchResultsCount: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRetrieveToken.mockReturnValue('mock-token');
  });

  test('renders search input and search button', () => {
    render(<SearchFountain {...defaultProps} />);

    expect(screen.getByPlaceholderText('Search fountains by name...')).toBeTruthy();
    expect(screen.getByRole('button', { name: /search/i })).toBeTruthy();
  });

  test('allows user to type in search input', () => {
    render(<SearchFountain {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search fountains by name...');
    fireEvent.change(searchInput, { target: { value: 'Water Fountain' } });

    expect((searchInput as HTMLInputElement).value).toBe('Water Fountain');
  });

  test('shows error when searching without a query', async () => {
    render(<SearchFountain {...defaultProps} />);

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockShowStatus).toHaveBeenCalledWith('Please enter a search term.', 'error');
    });
  });

  test('shows error when no token is available', async () => {
    mockRetrieveToken.mockReturnValue(null);

    render(<SearchFountain {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search fountains by name...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'Water Fountain' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockShowStatus).toHaveBeenCalledWith('Please log in to search fountains.', 'error');
    });
  });

  test('handles successful search with results', async () => {
    const mockFountains = [
      {
        createdBy: 'user123',
        _id: '1',
        name: 'Main Fountain',
        description: 'Central campus fountain',
        xCoord: 100,
        yCoord: 200,
        filterLevel: 5,
        rating: 4.5
      },
      {
        createdBy: 'user456',
        _id: '2',
        name: 'Library Fountain',
        description: 'Fountain near library',
        xCoord: 150,
        yCoord: 250,
        filterLevel: 4,
        rating: 4.0
      }
    ];

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        found: mockFountains,
        jwtToken: 'new-mock-token'
      }
    });

    render(<SearchFountain {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search fountains by name...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'Fountain' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('api/searchWaterFountainByName'),
        { name: 'Fountain', jwtToken: 'mock-token' },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );
      expect(mockOnResults).toHaveBeenCalledWith(mockFountains);
      expect(mockShowStatus).toHaveBeenCalledWith('Found 2 fountain(s) matching "Fountain"', 'success');
      expect(mockStoreToken).toHaveBeenCalledWith({ accessToken: 'new-mock-token' });
    });
  });

  test('handles search with no results', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        found: [],
        jwtToken: 'new-mock-token'
      }
    });

    render(<SearchFountain {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search fountains by name...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'NonexistentFountain' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockOnResults).toHaveBeenCalledWith([]);
      expect(mockShowStatus).toHaveBeenCalledWith('No fountains found matching "NonexistentFountain".', 'error');
    });
  });

  test('handles API error response', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        error: 'Database connection failed'
      }
    });

    render(<SearchFountain {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search fountains by name...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'Fountain' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockShowStatus).toHaveBeenCalledWith('Search error: Database connection failed', 'error');
    });
  });

  test('handles JWT token expiration error', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        error: 'JWT token expired'
      }
    });

    render(<SearchFountain {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search fountains by name...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'Fountain' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockShowStatus).toHaveBeenCalledWith('Session expired. Please log in again.', 'error');
    });
  });

  test('triggers search on Enter key press', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        found: [],
        jwtToken: 'new-mock-token'
      }
    });

    render(<SearchFountain {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search fountains by name...');
    fireEvent.change(searchInput, { target: { value: 'Fountain' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });

  test('shows clear button when search query exists', () => {
    render(<SearchFountain {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search fountains by name...');
    fireEvent.change(searchInput, { target: { value: 'Fountain' } });

    expect(screen.getByRole('button', { name: /clear/i })).toBeTruthy();
  });

  test('shows "Show All Fountains" button when search is active', () => {
    const propsWithActiveSearch = {
      ...defaultProps,
      isSearchActive: true,
      searchResultsCount: 5
    };

    render(<SearchFountain {...propsWithActiveSearch} />);

    expect(screen.getByRole('button', { name: /show all fountains \(5 found\)/i })).toBeTruthy();
  });

  test('clears search input and calls onClear when clear button is clicked', () => {
    render(<SearchFountain {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search fountains by name...');
    fireEvent.change(searchInput, { target: { value: 'Fountain' } });

    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);

    expect((searchInput as HTMLInputElement).value).toBe('');
    expect(mockOnClear).toHaveBeenCalled();
  });
});
