import {useState} from 'react';
import apiService from '../services/api';

interface LoginProps {
    onLogin: () => void;
}

export default function Login({onLogin}: LoginProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (isRegister) {
                await apiService.register(username, password);
                setIsRegister(false);
                setError('Registration successful! Please login.');
            } else {
                await apiService.login(username, password);
                onLogin();
            }
        } catch (error) {
            setError(isRegister ? 'Registration failed' : 'Login failed');
        }
    };

    return (
        <div style={{maxWidth: '400px', margin: '50px auto', padding: '20px'}}>
            <h2>{isRegister ? 'Register' : 'Login'}</h2>
            <form onSubmit={handleSubmit}>
                <div style={{marginBottom: '10px'}}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{width: '100%', padding: '8px'}}
                    />
                </div>
                <div style={{marginBottom: '10px'}}>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{width: '100%', padding: '8px'}}
                    />
                </div>
                <button type="submit" style={{width: '100%', padding: '10px'}}>
                    {isRegister ? 'Register' : 'Login'}
                </button>
            </form>

            <p style={{textAlign: 'center', marginTop: '10px'}}>
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
                <button
                    type="button"
                    onClick={() => setIsRegister(!isRegister)}
                    style={{background: 'none', border: 'none', color: 'blue', cursor: 'pointer'}}
                >
                    {isRegister ? 'Login' : 'Register'}
                </button>
            </p>

            {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}
        </div>
    );
}