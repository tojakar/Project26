// LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../components/Login';
import axios from 'axios';

// Mock axios to prevent actual API calls during tests
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock window.location.href
delete (window as any).location;
window.location = { href: '' } as any;

describe('Login Component Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders login form and allows input changes', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Find input fields by their placeholders as defined in the component
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Test that inputs can be changed
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123456' } });
    
    // Check that the form elements exist and can be interacted with
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(submitButton).toBeTruthy();
    
    // Verify the values were set
    expect((emailInput as HTMLInputElement).value).toBe('test@example.com');
    expect((passwordInput as HTMLInputElement).value).toBe('123456');
  });

  test('displays login form elements correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Check that all expected elements are present
    expect(screen.getByText('Log in')).toBeTruthy();
    expect(screen.getByText('Email:')).toBeTruthy();
    expect(screen.getByText('Password:')).toBeTruthy();
    expect(screen.getByRole('button', { name: /log in/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /no account\? register here/i })).toBeTruthy();
  });

  test('handles successful login submission', async () => {
    // Mock successful login response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        accessToken: 'fake-jwt-token.eyJ1c2VySWQiOiIxMjMiLCJmaXJzdE5hbWUiOiJKb2huIiwibGFzdE5hbWUiOiJEb2UifQ.signature'
      }
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

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

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

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
      expect(screen.getByText('Email/Password incorrect')).toBeTruthy();
    });
  });
});