import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function OAuthSuccess({ onLoginSuccess }) {
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const processAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (token) {
        onLoginSuccess(token);

        const pendingBuyNowStr = sessionStorage.getItem("pendingBuyNow");
        if (pendingBuyNowStr) {
          try {
            const pending = JSON.parse(pendingBuyNowStr);
            if (pending.productId) {
              await axios.post(`${baseUrl}/cart/${pending.productId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
            }
          } catch (err) {
            console.error("Could not add pending product to cart", err);
          } finally {
            sessionStorage.removeItem("pendingBuyNow");
            navigate("/cart", { replace: true });
          }
          return;
        }

        navigate("/home", { replace: true });
        return;
      }

      navigate("/login", { replace: true });
    };

    processAuth();
  }, [navigate, onLoginSuccess, baseUrl]);

  return <p>Logging you in...</p>;
}

export default OAuthSuccess;