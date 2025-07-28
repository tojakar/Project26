// RegisterUser.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../components/RegisterUser';
import axios from 'axios';

// Mock axios to prevent actual API calls during tests
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const RegisterWithRouter = () => (
  <BrowserRouter>
    <Register />
  </BrowserRouter>
);

describe('RegisterUser Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders registration form elements correctly', () => {
    render(<RegisterWithRouter />);

    // Check that all expected form elements are present
    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Example@gmail.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  test('handles successful user registration', async () => {
    // Mock successful registration response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        message: 'Registration successful! Please check your email for verification.'
      }
    });

    render(<RegisterWithRouter />);

    const firstNameInput = screen.getByPlaceholderText('First Name');
    const lastNameInput = screen.getByPlaceholderText('Last Name');
    const emailInput = screen.getByPlaceholderText('Example@gmail.com');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /register/i });

    // Fill in the registration form with valid password (has uppercase and number)
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'SecurePassword123' } });
    
    // Submit the form
    fireEvent.click(submitButton);

    // Wait for the API call to be made
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('api/register'),
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'SecurePassword123'
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    });
  });

  test('displays validation error for weak password', async () => {
    render(<RegisterWithRouter />);

    const firstNameInput = screen.getByPlaceholderText('First Name');
    const lastNameInput = screen.getByPlaceholderText('Last Name');
    const emailInput = screen.getByPlaceholderText('Example@gmail.com');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /register/i });

    // Fill in the registration form with weak password (no uppercase or number)
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    fireEvent.change(lastNameInput, { target: { value: 'Smith' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'weakpassword' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'weakpassword' } });
    
    // Submit the form
    fireEvent.click(submitButton);

    // Wait for the validation error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Password must contain at least one uppercase letter and one number/i)).toBeInTheDocument();
    });
  });
});
