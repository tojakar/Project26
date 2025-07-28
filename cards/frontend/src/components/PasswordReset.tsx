import axios from 'axios';
import { useState, useEffect } from 'react';
import { buildPath } from './Path';
import { useNavigate, useLocation } from 'react-router-dom';

function PasswordReset() {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentView, setCurrentView] = useState('forgot'); // 'forgot' or 'reset'
  
  const navigate = useNavigate();
  const location = useLocation();

  // Get token and id from URL parameters
  const urlParams = new URLSearchParams(location.search);
  const token = urlParams.get('token');
  const userId = urlParams.get('id');

  // Auto-switch to reset view if we have token and id in URL
  useEffect(() => {
    if (token && userId) {
      setCurrentView('reset');
    }
  }, [token, userId]);

  const doLogin = () => {
    navigate('/login');
  };

  const passwordCheck = (password: string): boolean => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasUpperCase && hasNumber;
  };

  async function doForgotPassword(event: any): Promise<void> {
    event.preventDefault();

    // Basic validation
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    const obj = {
      email: email
    };

    try {
      const response = await axios.post(buildPath('api/passResetEmail'), obj, {
        headers: { 'Content-Type': 'application/json' }
      });

      // Check if request was successful
      if (response.data.error) {
        setMessage(response.data.error);
        return;
      }

      // Success message
      if (response.data.message) {
        setMessage(response.data.message);
        setEmail('');
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.error) {
        setMessage(error.response.data.error);
      } else {
        setMessage('Request failed. Please try again.');
      }
      console.log(error);
    }
  }

  async function doPasswordReset(event: any): Promise<void> {
    event.preventDefault();

    // Basic validation
    if (!newPassword || !confirmPassword) {
      setMessage('Please fill in all fields');
      return;
    }

    // Password complexity checks
    if (!passwordCheck(newPassword)) {
      setMessage('Password must contain at least one uppercase letter and one number');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    const obj = {
      token: token,
      newPassword: newPassword
    };

    try {
      const response = await axios.post(buildPath('api/passReset'), obj, {
        headers: { 'Content-Type': 'application/json' }
      });

      // Check if reset was successful
      if (response.data.error) {
        setMessage(response.data.error);
        return;
      }

      // Reset successful
      if (response.data.message) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.error) {
        setMessage(error.response.data.error);
      } else {
        setMessage('Password reset failed. Please try again.');
      }
      console.log(error);
    }
  }

  function handleSetEmail(e: any): void {
    setEmail(e.target.value);
  }

  function handleSetNewPassword(e: any): void {
    setNewPassword(e.target.value);
  }

  function handleSetConfirmPassword(e: any): void {
    setConfirmPassword(e.target.value);
  }

  const ForgotPasswordForm = () => (
    <div className="background-container">
      <div id="ButtonDiv" className="form">
        <span id="inner-title">Forgot Password</span><br />
        Email: <input 
          type="email" 
          id="forgotEmail" 
          placeholder="Example@gmail.com" 
          value={email}
          onChange={handleSetEmail} 
        /><br />
        <button 
          type="button" 
          id="sendResetButton" 
          className="buttons" 
          onClick={doForgotPassword}
        >
          Send Reset Link
        </button>
        <button 
          type="button" 
          id="backToLoginButton" 
          className="buttons" 
          onClick={doLogin}
        >
          Back to Login
        </button>
        <span id="forgotPasswordResult">{message}</span>
      </div>
    </div>
  );

  const ResetPasswordForm = () => (
    <div className="background-container">
      <div id="ButtonDiv" className="form">
        <span id="inner-title">Reset Password</span><br />
        New Password: <input 
          type="password" 
          id="newPassword" 
          placeholder="New Password" 
          value={newPassword}
          onChange={handleSetNewPassword} 
        /><br />
        Confirm Password: <input 
          type="password" 
          id="confirmNewPassword" 
          placeholder="Confirm New Password" 
          value={confirmPassword}
          onChange={handleSetConfirmPassword} 
        /><br />
        <button 
          type="button" 
          id="resetPasswordButton" 
          className="buttons" 
          onClick={doPasswordReset}
        >
          Reset Password
        </button>
        <button 
          type="button" 
          id="backToLoginButton" 
          className="buttons" 
          onClick={doLogin}
        >
          Back to Login
        </button>
        <span id="resetPasswordResult">{message}</span>
      </div>
    </div>
  );

  return currentView === 'forgot' ? <ForgotPasswordForm /> : <ResetPasswordForm />;
}

export default PasswordReset;