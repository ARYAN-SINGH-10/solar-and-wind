import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400 text-sm animate-pulse font-mono">
        Validating Role Permissions...
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role_name)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
