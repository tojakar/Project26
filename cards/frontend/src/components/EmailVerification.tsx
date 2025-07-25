import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildPath } from './Path';

type VerificationStatus = 'verifying' | 'success' | 'error';

const EmailVerification: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<VerificationStatus>('verifying');
    const [message, setMessage] = useState<string>('Verifying your email...');

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');
            
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link. No token provided.');
                return;
            }

            try {
                // Make API call to your backend verification endpoint
                const response = await axios.get(buildPath(`api/verify-email?token=${token}`), {
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (response.status === 200) {
                    setStatus('success');
                    setMessage('Email verified successfully! You can now log in to your account.');
                }
            } catch (error: any) {
                setStatus('error');
                if (error.response?.data?.error) {
                    setMessage(error.response.data.error);
                } else if (error.response?.data?.message) {
                    setMessage(error.response.data.message);
                } else {
                    setMessage('Verification failed. The link may be expired or invalid.');
                }
            }
        };

        verifyEmail();
    }, [searchParams]);

    const handleContinueToLogin = () => {
        navigate('/login');
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };

    return (
        <div className="background-container">
            <div id="ButtonDiv" className="form">
                <span id="inner-title">Email Verification</span><br />
                
                {status === 'verifying' && (
                    <div>
                        <span id="verificationResult">{message}</span>
                    </div>
                )}
                
                {status === 'success' && (
                    <div>
                        <span id="verificationResult">{message}</span><br />
                        <button 
                            type="button" 
                            className="buttons" 
                            onClick={handleContinueToLogin}
                        >
                            Continue to Login
                        </button>
                    </div>
                )}
                
                {status === 'error' && (
                    <div>
                        <span id="verificationResult">{message}</span><br />
                        <button 
                            type="button" 
                            className="buttons" 
                            onClick={handleBackToLogin}
                        >
                            Back to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailVerification;