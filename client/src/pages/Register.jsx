import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";

function Register() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
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
      await axios.post(`${baseUrl}/users/register`, registerData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setStatus({ type: "success", message: "Registered successfully." });
      navigate("/login", { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (typeof error?.response?.data === "string" ? error.response.data : null) ||
        error?.response?.data?.error || "Internal server error!";

      setStatus({ type: "error", message});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card" role="region" aria-live="polite">
        <form
          className="form"
          aria-label="Register form"
          onSubmit={handleSubmit}
        >
          <div>
            <h2>Create account</h2>
            <p>Join the community of consistent learners.</p>
          </div>
          {status && <p className={`status ${status.type}`}>{status.message}</p>}
          <label className="field">
            <span>Name</span>
            <input
              type="text"
              name="name"
              placeholder="Full name"
              value={registerData.name}
              onChange={handleRegisterChange}
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={registerData.email}
              onChange={handleRegisterChange}
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={registerData.password}
              onChange={handleRegisterChange}
            />
          </label>
          <button className="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register"}
          </button>
          <button
            type="button"
            className="google-btn"
            onClick={() => {
              window.location.href = `${baseUrl.replace(
                "/api/v1",
                ""
              )}/oauth2/authorization/google`;
            }}
          >
            Continue with Google
          </button>
          <p className="helper">
            Already have an account? <Link className="link" to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
