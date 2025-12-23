import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Stepper, { Step } from '../../components/ui/Stepper/Stepper';
import { KeyRound, Mail, User } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleFinalStep = async () => {
        // Trigger registration
        const res = await register(formData.username, formData.email, formData.password);
        if (res.success) {
            navigate('/');
        } else {
            setError(res.message);
        }
    };

    return (
        <div style={{ height: '100vh', width: '100vw', background: '#0f172a' }}>
            <Stepper
                initialStep={1}
                onFinalStepCompleted={handleFinalStep}
                backButtonText="Prev"
                nextButtonText="Continue"
            >
                <Step>
                    <h2>Welcome to CryptoVue</h2>
                    <p>Let's get you set up. What should we call you?</p>
                    <div style={{ marginTop: '2rem' }}>
                        <div className="input-field">
                            <User size={20} />
                            <input
                                type="text"
                                placeholder="Username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                        <div className="input-field">
                            <Mail size={20} />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>
                </Step>

                <Step>
                    <h2>Secure your account</h2>
                    <p>Choose a strong password.</p>
                    <div style={{ marginTop: '2rem' }}>
                        <div className="input-field">
                            <KeyRound size={20} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>
                    {error && <p style={{ color: '#ef4444', marginTop: '1rem' }}>{error}</p>}
                </Step>

                <Step>
                    <h2>Ready to go!</h2>
                    <p>Click Finish to create your account and access your wallet.</p>
                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem' }}>🚀</div>
                    </div>
                </Step>
            </Stepper>
        </div>
    );
};

export default Login;
