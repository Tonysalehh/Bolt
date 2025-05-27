import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminRoute() {
  const { user, loading } = useAuth();

  // Check if the user profile has admin role
  const checkAdminRole = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();
    
    return profile?.role === 'admin';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If logged in but not admin, redirect to home
  if (!checkAdminRole()) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}