import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Stepper, { Step } from '../../components/ui/Stepper/Stepper';
import { KeyRound, Mail, User, ShieldCheck, AlertTriangle, Lock } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [formData, setFormData] = useState({ username: '', email: '', password: '', '2fa': '' });
    const [mnemonic, setMnemonic] = useState('');
    const [error, setError] = useState('');
    const [is2FAVisible, setIs2FAVisible] = useState(false);

    const { login, register, verify2FA } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        const res = await login(formData.email, formData.password);
        if (res.success && res.requires2FA) {
            setIs2FAVisible(true);
            setError('');
        } else if (res.success) {
            navigate('/');
        } else {
            setError(res.message);
        }
    };

    const handle2FAVerify = async () => {
        const res = await verify2FA(formData['2fa']);
        if (res.success) {
            navigate('/');
        } else {
            setError(res.message);
        }
    };

    const handleRegisterStep = async () => {
        const res = await register(formData.username, formData.email, formData.password);
        if (res.success) {
            setMnemonic(res.mnemonic);
        } else {
            setError(res.message);
        }
    };

    if (is2FAVisible) {
        return (
            <div className="login-container">
                <div className="login-card security-step">
                    <ShieldCheck size={48} color="var(--primary)" />
                    <h2>Two-Factor Authentication</h2>
                    <p>Enter the 6-digit code from your authenticator app. (Demo: 123456)</p>
                    <div className="input-field">
                        <KeyRound size={20} />
                        <input
                            type="text"
                            placeholder="000000"
                            value={formData['2fa']}
                            onChange={(e) => setFormData({ ...formData, '2fa': e.target.value })}
                            maxLength={6}
                        />
                    </div>
                    {error && <p className="error-text">{error}</p>}
                    <button className="submit-btn" onClick={handle2FAVerify}>Verify & Enter</button>
                </div>
            </div>
        );
    }

    if (mnemonic) {
        return (
            <div className="login-container">
                <div className="login-card security-step">
                    <AlertTriangle size={48} color="#f59e0b" />
                    <h2>Backup your Seed Phrase</h2>
                    <p>This is the ONLY way to recover your wallet. Write it down and keep it safe.</p>
                    <div className="mnemonic-display">
                        {mnemonic.split(' ').map((word, i) => (
                            <span key={i} className="word"><small>{i + 1}</small> {word}</span>
                        ))}
                    </div>
                    <button className="submit-btn" onClick={() => navigate('/')}>I've backed it up</button>
                    <p className="warning-text">Never share this phrase with anyone. Staff will never ask for it.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            {mode === 'login' ? (
                <div className="login-card">
                    <h2>Welcome Back</h2>
                    <p>Sign in to access your secure wallet.</p>
                    <form onSubmit={handleLogin}>
                        <div className="input-field">
                            <Mail size={20} />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-field">
                            <KeyRound size={20} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                        {error && <p className="error-text">{error}</p>}
                        <button type="submit" className="submit-btn">Login</button>
                    </form>
                    <p className="toggle-text">
                        New to CryptoVue? <span onClick={() => setMode('register')}>Create Account</span>
                    </p>
                </div>
            ) : (
                <Stepper
                    initialStep={1}
                    onFinalStepCompleted={handleRegisterStep}
                    backButtonText="Prev"
                    nextButtonText="Continue"
                >
                    <Step>
                        <h2>Create Account</h2>
                        <p>What should we call you?</p>
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
                        <h2>Secure Wallet</h2>
                        <p>Choose a master password for encryption.</p>
                        <div style={{ marginTop: '2rem' }}>
                            <div className="input-field">
                                <KeyRound size={20} />
                                <input
                                    type="password"
                                    placeholder="Master Password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>
                        {error && <p className="error-text">{error}</p>}
                        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '1rem' }}>
                            This password encrypts your local vault. We never store it.
                        </p>
                    </Step>

                    <Step>
                        <h2>Final Security Check</h2>
                        <p>We're about to generate your unique 12-word seed phrase.</p>
                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem' }}>🔐</div>
                        </div>
                        <p className="toggle-text" style={{ marginTop: '1rem' }}>
                            Already have an account? <span onClick={() => setMode('login')}>Login here</span>
                        </p>
                    </Step>
                </Stepper>
            )}
        </div>
    );
};

export default Login;
