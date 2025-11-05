import {useState} from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import apiService from './services/api';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(apiService.isAuthenticated());

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        apiService.logout();
        setIsAuthenticated(false);
    };

    return (
        <div>
            {isAuthenticated ? (
                <Dashboard onLogout={handleLogout}/>
            ) : (
                <Login onLogin={handleLogin}/>
            )}
        </div>
    );
}

export default App;