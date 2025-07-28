// LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../components/Login';
import axios from 'axios';

// Mock axios to prevent actual API calls during tests
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const LoginWithRouter = () => (
  <BrowserRouter>
    <Login />
  </BrowserRouter>
);

describe('Login Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form elements correctly', () => {
    render(<LoginWithRouter />);

    // Check that all expected elements are present
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  test('handles successful login submission', async () => {
    // Mock successful login response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        accessToken: 'fake-jwt-token'
      }
    });

    render(<LoginWithRouter />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Fill in the form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(submitButton);

    // Wait for the API call to be made
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('api/login'),
        { email: 'test@example.com', password: 'password123' },
        { headers: { 'Content-Type': 'application/json' } }
      );
    });
  });

  test('displays error message on failed login', async () => {
    // Mock failed login response
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          error: 'Email/Password incorrect'
        }
      }
    });

    render(<LoginWithRouter />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Fill in the form with incorrect credentials
    fireEvent.change(emailInput, { target: { value: 'wrong@email.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    
    // Submit the form
    fireEvent.click(submitButton);

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Email/Password incorrect')).toBeInTheDocument();
    });
  });
});