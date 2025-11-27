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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">{isRegister ? 'Register' : 'Login'}</h2>
                    <p className="text-gray-600 mt-2">Remote Control System</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                        {isRegister ? 'Register' : 'Login'}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <span className="text-gray-600">
                        {isRegister ? 'Already have an account?' : "Don't have an account?"}
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsRegister(!isRegister)}
                        className="ml-2 text-gray-900 hover:text-gray-700 font-medium underline"
                    >
                        {isRegister ? 'Login' : 'Register'}
                    </button>
                </div>

                {error && (
                    <div className={`text-center mt-4 p-3 rounded-lg ${
                        error.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}