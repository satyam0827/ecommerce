import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";

function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    if (!baseUrl) {
      setStatus({
        type: "error",
        message: "Missing VITE_BACKEND_URL in the .env file.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await axios.post(`${baseUrl}/users/login`, loginData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const token = res.data;
      if (token) {
        onLoginSuccess(token);
      }

      const pendingBuyNowStr = sessionStorage.getItem("pendingBuyNow");
      if (pendingBuyNowStr) {
        try {
          const pending = JSON.parse(pendingBuyNowStr);
          if (pending.productId) {
            await axios.post(`${baseUrl}/cart/${pending.productId}`, {}, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        } catch (err) {
          console.error("Could not add pending product to cart", err);
        } finally {
          sessionStorage.removeItem("pendingBuyNow");
          setStatus({ type: "success", message: "Logged in successfully." });
          navigate("/cart", { replace: true });
        }
        return;
      }

      setStatus({ type: "success", message: "Logged in successfully." });
      navigate("/home", { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Network error. Please try again.";
      setStatus({ type: "error", message });
    } finally {
      setIsSubmitting(false);
      
    }
  };

  const handleResetPass = ()=>{

  }
  return (
    <div className="auth-shell">
      <div className="auth-card" role="region" aria-live="polite">
        <form className="form" aria-label="Login form" onSubmit={handleSubmit}>
          <div>
            <h2>Welcome back</h2>
            <p>Continue your learning journey.</p>
          </div>
          {status && <p className={`status ${status.type}`}>{status.message}</p>}
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={loginData.email}
              onChange={handleLoginChange}
            />
          </label>
          <label className="field">
            <span>Password</span>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={loginData.password}
              onChange={handleLoginChange}
            />
          </label>
          <button className="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
          <a href="https://www.google.com"> Forgot Password?</a>
          <button
            type="button"
            className="google-btn"  
            onClick={() => {
              window.location.href = `${baseUrl}/oauth2/authorization/google`;
            }}
          >
            Signin with Google
          </button>
          <p className="helper">
            New here? <Link className="link" to="/register">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;