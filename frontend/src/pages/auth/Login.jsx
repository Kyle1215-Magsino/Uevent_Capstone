import { Navigate } from 'react-router-dom';

// Login is now a modal on the Landing page. This redirect handles direct /login navigation.
export default function Login() {
  return <Navigate to="/" state={{ authModal: 'login' }} replace />;
}
