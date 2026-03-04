import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getTenantPrefixFromPathname, joinTenantPath } from "../utils/tenantPaths";

const PrivateRoute = () => {
  const location = useLocation();
  const token = localStorage.getItem("access_token");

  if (!token) {
    const tenantPrefix = getTenantPrefixFromPathname(location.pathname);
    return (
      <Navigate
        to={joinTenantPath(tenantPrefix, "/login")}
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
};

export default PrivateRoute;

