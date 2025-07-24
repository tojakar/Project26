import axios from 'axios';
import { useState } from 'react';
import { buildPath } from './Path';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [message, setMessage] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();

  const doLogin = () => {
    navigate('/login');
  };

  const passwordCheck = (password: string): boolean => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasUpperCase && hasNumber;
  }

  async function doRegister(event: any): Promise<void> {
    event.preventDefault();

    // Basic validation
    if (!firstName || !lastName || !email || !password) {
      setMessage('\nPlease fill in all fields');
      return;
    }


    // add password complexity checks uppercase letter and number
    if(!passwordCheck(password)) {
      setMessage('\nPassword must contain at least one uppercase letter and one number')
      return;
    }

    if (password !== confirmPassword) {
      setMessage('\nPasswords do not match');
      return;
    }

    const obj = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password
    };

    try {
      const response = await axios.post(buildPath('api/register'), obj, {
        headers: { 'Content-Type': 'application/json' }
      });

      // Check if registration was successful
      if (response.data.error) {
        setMessage(response.data.error);
        return;
      }

      // Registration successful - your API returns { message: 'User created successfully', user: newUser }
      if (response.data.message) {
        setMessage('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.error) {
        setMessage(error.response.data.error);
      } else {
        setMessage('Registration failed. Please try again.');
      }
      console.log(error);
    }
  }

  function handleSetFirstName(e: any): void {
    setFirstName(e.target.value);
  }

  function handleSetLastName(e: any): void {
    setLastName(e.target.value);
  }

  function handleSetEmail(e: any): void {
    setEmail(e.target.value);
  }

  function handleSetPassword(e: any): void {
    setPassword(e.target.value);
  }

  function handleSetConfirmPassword(e: any): void {
    setConfirmPassword(e.target.value);
  }

  return (
    <div className="background-container">
    <div id="ButtonDiv" className="form">
      <span id="inner-title">Register</span><br />
      First Name: <input type="text" id="firstName" placeholder="First Name" onChange={handleSetFirstName} /><br />
      Last Name: <input type="text" id="lastName" placeholder="Last Name" onChange={handleSetLastName} /><br />
      Email: <input type="text" id="registerEmail" placeholder="Email" onChange={handleSetEmail} /><br />
      Password: <input type="password" id="registerPassword" placeholder="Password" onChange={handleSetPassword} /><br />
      Confirm Password: <input type="password" id="confirmPassword" placeholder="Confirm Password" onChange={handleSetConfirmPassword} />
      
      <br />
      <button type="button" id="registerButton" className="buttons" onClick={doRegister}>Register</button>
      <button type="button" id="loginButton" className="buttons" onClick={doLogin}>Already have an account? Log In</button>
      <span id="registerResult">{message}</span>
    </div>
    </div>
  );
}

export default Register;