import axios from 'axios';
import { useState } from 'react';
import { buildPath } from './Path';
import { useNavigate } from 'react-router-dom';

function PasswordReset() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const userId = params.get('id');

  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const doLogin = () => navigate('/login');

  const passwordCheck = (password: string): boolean =>
    /[A-Z]/.test(password) && /\d/.test(password);

  const doForgotPassword = async (e: any) => {
    e.preventDefault();
    if (!email) return setMessage('Please enter your email address');

    try {
      const res = await axios.post(buildPath('api/passResetEmail'), { email });
      if (res.data.error) setMessage(res.data.error);
      else setMessage(res.data.message || '');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Request failed.');
    }
  };

  const doPasswordReset = async (e: any) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword)
      return setMessage('Please fill in all fields');
    if (!passwordCheck(newPassword))
      return setMessage('Password must contain at least one uppercase letter and one number');
    if (newPassword !== confirmPassword)
      return setMessage('Passwords do not match');

    try {
      const res = await axios.post(buildPath('api/passReset'), { token, newPassword });
      if (res.data.error) return setMessage(res.data.error);
      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Reset failed.');
    }
  };

  return (
    <div className="background-container">
      <div id="ButtonDiv" className="form">
        <span id="inner-title">{token && userId ? 'Reset Password' : 'Forgot Password'}</span><br />
        {token && userId ? (
          <>
            New Password: <input
              type="password"
              placeholder='New Password'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            /><br />
            Confirm Password: <input
              type="password"
              placeholder='Confirm Password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            /><br />
            <button className="buttons" onClick={doPasswordReset}>Reset Password</button>
          </>
        ) : (
          <>
            Email: <input
              type="email"
              placeholder='Enter your email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            /><br />
            <button className="buttons" onClick={doForgotPassword}>Send Reset Link</button>
          </>
        )}
        <button className="buttons" onClick={doLogin}>Back to Login</button>
        <span>{message}</span>
      </div>
    </div>
  );
}

export default PasswordReset;