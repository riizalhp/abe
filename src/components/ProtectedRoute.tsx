import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User, Role } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  currentUser: User | null;
  allowedRoles?: Role[];
  redirectTo?: string;
}

/**
 * ProtectedRoute - Guards routes based on authentication and role
 * 
 * Usage:
 * <ProtectedRoute currentUser={user} allowedRoles={[Role.ADMIN, Role.OWNER]}>
 *   <AdminPage />
 * </ProtectedRoute>
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  currentUser,
  allowedRoles,
  redirectTo = '/login'
}) => {
  const location = useLocation();

  // Check if user is authenticated
  if (!currentUser) {
    // Redirect to login with return URL
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check if user has required role (if roles are specified)
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(currentUser.role)) {
      // User doesn't have permission - redirect to dashboard with error
      return <Navigate to="/dashboard" state={{ error: 'Akses ditolak. Anda tidak memiliki izin untuk halaman ini.' }} replace />;
    }
  }

  return <>{children}</>;
};

/**
 * withRoleGuard - HOC for role-based protection
 */
export function withRoleGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: Role[]
) {
  return function RoleGuardedComponent(props: P & { currentUser: User | null }) {
    const { currentUser, ...rest } = props;

    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4">
            <span className="material-symbols-outlined text-4xl text-red-600 dark:text-red-400">
              lock
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Akses Ditolak
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
        </div>
      );
    }

    return <WrappedComponent {...(rest as P)} currentUser={currentUser} />;
  };
}

/**
 * useRoleCheck - Hook for checking user roles
 */
export function useRoleCheck(currentUser: User | null, requiredRoles: Role[]): boolean {
  if (!currentUser) return false;
  return requiredRoles.includes(currentUser.role);
}

/**
 * Role permission constants
 */
export const ROLE_PERMISSIONS = {
  // Admin & Owner have full access
  FULL_ACCESS: [Role.ADMIN, Role.OWNER],
  
  // Management pages
  MANAGEMENT: [Role.ADMIN, Role.OWNER],
  
  // Operational pages (includes mechanics)
  OPERATIONS: [Role.ADMIN, Role.OWNER, Role.MEKANIK],
  
  // All authenticated users
  ALL_AUTHENTICATED: [Role.ADMIN, Role.OWNER, Role.MEKANIK, Role.KASIR],
  
  // Finance related
  FINANCE: [Role.ADMIN, Role.OWNER, Role.KASIR],
};

export default ProtectedRoute;
