import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthEventHandler = () => {
  const navigate = useNavigate();
  const { isRecoveryMode } = useAuth();

  useEffect(() => {
    if (isRecoveryMode) {
      navigate('/reset-password', { replace: true });
    }
  }, [isRecoveryMode, navigate]);

  return null;
};

export default AuthEventHandler;
