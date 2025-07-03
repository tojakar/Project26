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


  async function doLogin(event: any): Promise<void> {
    event.preventDefault();
    const obj = { email: email, password: loginPassword };

    try {
      const response = await axios.post(buildPath('api/login'), obj, {
        headers: { 'Content-Type': 'application/json' }
      });

      const { accessToken } = response.data;
      storeToken(response.data);

      try {
        const decoded: any = jwtDecode(accessToken);

        const userId = decoded._id;
        const firstName = decoded.firstName;
        const lastName = decoded.lastName;

        if (userId <= 0) {
          setMessage('User/Password combination incorrect');
        } else {
          const user = { firstName, lastName, id: userId };
          localStorage.setItem('user_data', JSON.stringify(user));
          setMessage('');
          window.location.href = '/cards';
        }
      } catch (e) {
        console.log(e);
        return;
      }
    } catch (error: any) {
      alert(error.toString());
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
    <div id="loginDiv" style={{color: 'black' }}>
      <span id="inner-title">Log in</span><br />
      Email: <input type="text" id="loginName" placeholder="Email" onChange={handleSetEmail} /><br />
      Password: <input type="password" id="loginPassword" placeholder="Password" onChange={handleSetPassword} />
      <br />
      <button type="button" id="loginButton" className="buttons" onClick={doLogin}>  Log In </button>
      <button type="button" id="registerButton" className="buttons" onClick={doRegister}> No account? Register Here</button>
      <span id="loginResult">{message}</span>
    </div>
  );
}

export default Login;