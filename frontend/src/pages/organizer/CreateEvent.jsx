import { Navigate } from 'react-router-dom';

// CreateEvent is now a modal inside ManageEvents. This redirect handles direct navigation.
export default function CreateEvent() {
  return <Navigate to="/organizer/events" replace />;
}
