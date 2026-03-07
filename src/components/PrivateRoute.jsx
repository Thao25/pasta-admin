import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  // Nếu không có token -> Đá về trang login
  return token ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
