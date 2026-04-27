import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import NavBar from "./Components/NavBar.jsx";
import OAuthSuccess from "./Components/Oauth2Success.jsx";
import AdminOrdersPage from "./pages/AdminOrdersPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import AddressPage from "./pages/AddressPage.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import PaymentSuccessPage from "./pages/PaymentSuccessPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import Register from "./pages/Register.jsx";

const decodeTokenPayload = (token) => {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  const normalizedPayload = payload
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(payload.length / 4) * 4, "=");

  return JSON.parse(atob(normalizedPayload));
};

const getAuthState = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return {
      isAuthenticated: false,
      role: null,
    };
  }

  try {
    const [, payload] = token.split(".");

    if (!payload) {
      localStorage.removeItem("token");
      return {
        isAuthenticated: false,
        role: null,
      };
    }

    const decodedPayload = decodeTokenPayload(token);
    const expirationTime = decodedPayload?.exp;
    const role = decodedPayload?.role ?? null;

    if (!expirationTime) {
      return {
        isAuthenticated: true,
        role,
      };
    }

    const isExpired = Date.now() >= expirationTime * 1000;
    if (isExpired) {
      localStorage.removeItem("token");
      return {
        isAuthenticated: false,
        role: null,
      };
    }

    return {
      isAuthenticated: true,
      role,
    };
  } catch {
    localStorage.removeItem("token");
    return {
      isAuthenticated: false,
      role: null,
    };
  }
};

function App() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const [authState, setAuthState] = useState(() => getAuthState());
  const [cartCount, setCartCount] = useState(0);
  const isAuthenticated = authState.isAuthenticated;
  const isAdmin = authState.role === "ADMIN";

  useEffect(() => {
    const handleStorageChange = () => {
      const nextAuthState = getAuthState();
      setAuthState(nextAuthState);

      if (!nextAuthState.isAuthenticated) {
        setCartCount(0);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setCartCount(0);
      return;
    }

    loadCartCount();
  }, [isAuthenticated, baseUrl]);

  const handleLoginSuccess = (token) => {
    localStorage.setItem("token", token);
    setAuthState(getAuthState());
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthState({
      isAuthenticated: false,
      role: null,
    });
  };

  const loadCartCount = async () => {
    const token = localStorage.getItem("token");

    if (!baseUrl || !token || !getAuthState().isAuthenticated) {
      setCartCount(0);
      return;
    }

    try {
      const response = await axios.get(`${baseUrl}/cart/count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCartCount(response.data?.count ?? 0);
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        localStorage.removeItem("token");
        setAuthState({
          isAuthenticated: false,
          role: null,
        });
      }

      setCartCount(0);
    }
  };

  return (
    <>
      <NavBar
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        cartCount={cartCount}
        onLogOut={handleLogout}
      />
      <Routes>
        <Route
          path="/home"
          element={
            <Home
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              onCartChange={loadCartCount}
            />
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/home" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? <Navigate to="/home" replace /> : <Register />
          }
        />
        <Route
          path="/cart"
          element={
            isAuthenticated ? (
              <CartPage onCartChange={loadCartCount} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/payment"
          element={
            isAuthenticated ? (
              <PaymentPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/payment/success"
          element={
            isAuthenticated ? (
              <PaymentSuccessPage onPaymentComplete={loadCartCount} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/checkout/address"
          element={
            isAuthenticated ? (
              <AddressPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin"
          element={
            isAuthenticated ? (
              isAdmin ? (
                <AdminOrdersPage />
              ) : (
                <Navigate to="/home" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              <ProfilePage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/oauth-success"
          element={<OAuthSuccess onLoginSuccess={handleLoginSuccess} />}
        />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </>
  );
}

export default App;
