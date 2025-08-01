import axios from 'axios';
import React, { useState } from 'react';
import { buildPath } from './Path';
import { storeToken } from '../tokenStorage';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [message, setMessage] = useState('');
  const [email, setEmail] = React.useState('');
  const [loginPassword, setPassword] = React.useState('');

  const navigate = useNavigate();

  const doRegister = () => {
  navigate('/register');
  };

 const doForgotPassword = (): void => {
  navigate('/forgot-password');
};




  async function doLogin(event: any): Promise<void> {
    event.preventDefault();
    const obj = { email: email, password: loginPassword };

    try {
      const response = await axios.post(buildPath('api/login'), obj, {
        headers: { 'Content-Type': 'application/json' }
      });

      const { accessToken } = response.data;

      if (!accessToken) {
        setMessage('Login failed: No token received.');
        return;
      }

      // Store the string token
      storeToken({ accessToken });

      try {
        const decoded: any = jwtDecode(accessToken);

        // Ensure payload has expected structure
        const { userId, firstName, lastName } = decoded;

        if (!userId) {
          setMessage('User/Password combination incorrect');
        } else {
          const user = { firstName, lastName, userId: userId };
          localStorage.setItem('user_data', JSON.stringify(user));
          setMessage('');
          window.location.href = '/Map';
        }
      } catch (e) {
        console.error("Token decoding failed:", e);
        setMessage('An error occurred during login. Please try again.');
        return;
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.error) {
        setMessage(error.response.data.error);
      } else {
        setMessage('An unexpected error occurred. Please try again.');
      }
      return;
    }
  }

  function handleSetEmail(e: any): void {
    setEmail(e.target.value);
  }

  function handleSetPassword(e: any): void {
    setPassword(e.target.value);
  }

 return (
  <div className="background-container">
    <div id="ButtonDiv" className="form">
      <span id="inner-title">Log in</span><br />
      Email: <input type="text" id="loginName" placeholder="Email" onChange={handleSetEmail} /><br />
      Password: <input type="password" id="loginPassword" placeholder="Password" onChange={handleSetPassword} />
      <br />
      <button type="button" id="loginButton" className="buttons" onClick={doLogin}>  Log In </button>
      
      <button type="button" id="registerButton" className="buttons" onClick={doRegister}> No account? Register Here</button>
      <span id="forgotPasswordLink" style={{cursor: 'pointer', textDecoration: 'underline', color: 'white'}}onClick={doForgotPassword}>Forgot Password?</span>
      <span id="loginResult">{message}</span>
    </div>
  </div>
);
}

export default Login;