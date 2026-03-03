import { Navigate } from 'react-router-dom';

// Register is now a modal on the Landing page. This redirect handles direct /register navigation.
export default function Register() {
  return <Navigate to="/" state={{ authModal: 'register' }} replace />;
}
