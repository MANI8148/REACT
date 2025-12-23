import { BrowserRouter, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import AppRoutes from './routes';

function App() {
  return (
    <AuthContextWrapper>
      <BrowserRouter>
        <Routes>
          {AppRoutes}
        </Routes>
      </BrowserRouter>
    </AuthContextWrapper>
  );
}

const AuthContextWrapper = ({ children }) => (
  <AuthProvider>
    {children}
  </AuthProvider>
);

export default App;


