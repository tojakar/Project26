// RegisterUser.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../components/RegisterUser';
import axios from 'axios';

// Mock axios to prevent actual API calls during tests
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Register Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders registration form with all required fields', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Check that all form fields are present
    expect(screen.getByPlaceholderText('First Name')).toBeTruthy();
    expect(screen.getByPlaceholderText('Last Name')).toBeTruthy();
    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    expect(screen.getByPlaceholderText('Confirm Password')).toBeTruthy();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /already have an account/i })).toBeTruthy();
  });

  test('allows user to fill in registration form', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const firstNameInput = screen.getByPlaceholderText('First Name');
    const lastNameInput = screen.getByPlaceholderText('Last Name');
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');

    // Fill in the form
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });

    // Verify the values were set
    expect((firstNameInput as HTMLInputElement).value).toBe('John');
    expect((lastNameInput as HTMLInputElement).value).toBe('Doe');
    expect((emailInput as HTMLInputElement).value).toBe('john.doe@example.com');
    expect((passwordInput as HTMLInputElement).value).toBe('Password123');
    expect((confirmPasswordInput as HTMLInputElement).value).toBe('Password123');
  });

  test('shows validation error for missing fields', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    
    // Try to submit empty form
    fireEvent.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/please fill in all fields/i)).toBeTruthy();
    });
  });

  test('shows validation error for password mismatch', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const firstNameInput = screen.getByPlaceholderText('First Name');
    const lastNameInput = screen.getByPlaceholderText('Last Name');
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    // Fill in form with mismatched passwords
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeTruthy();
    });
  });

  test('shows validation error for weak password', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const firstNameInput = screen.getByPlaceholderText('First Name');
    const lastNameInput = screen.getByPlaceholderText('Last Name');
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    // Fill in form with weak password (no uppercase or number)
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'weakpassword' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'weakpassword' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one uppercase letter and one number/i)).toBeTruthy();
    });
  });

  test('handles successful registration', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        message: 'Registration successful. Check your email to verify your account.'
      }
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const firstNameInput = screen.getByPlaceholderText('First Name');
    const lastNameInput = screen.getByPlaceholderText('Last Name');
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    // Fill in valid form
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('api/register'),
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'Password123'
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
    });
  });
});
