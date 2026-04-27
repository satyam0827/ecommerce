import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../App.css";

const CHECKOUT_ADDRESS_KEY = "checkoutAddress";

function PaymentSuccessPage({ onPaymentComplete }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const hasUpdatedCart = useRef(false);
  const [status, setStatus] = useState({
    loading: true,
    error: "",
    data: null,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!sessionId) {
      setStatus({
        loading: false,
        error: "Missing Stripe session id in the success URL.",
        data: null,
      });
      return undefined;
    }

    if (!baseUrl) {
      setStatus({
        loading: false,
        error: "Missing VITE_BACKEND_URL",
        data: null,
      });
      return undefined;
    }

    if (!token) {
      navigate("/login", { replace: true });
      return undefined;
    }

    let timeoutId;
    let cancelled = false;

    const loadStatus = async () => {
      try {
        const response = await axios.get(`${baseUrl}/payments/checkout-session/${sessionId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (cancelled) {
          return;
        }

        const data = response.data;
        setStatus({
          loading: false,
          error: "",
          data,
        });

        if (data?.orderStatus === "PAID") {
          sessionStorage.removeItem(CHECKOUT_ADDRESS_KEY);

          if (!hasUpdatedCart.current) {
            hasUpdatedCart.current = true;
            await onPaymentComplete?.();
          }
          return;
        }

        if (data?.orderStatus === "PENDING") {
          timeoutId = window.setTimeout(loadStatus, 3000);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to verify payment status.";

        setStatus({
          loading: false,
          error: message,
          data: null,
        });
      }
    };

    loadStatus();

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [baseUrl, navigate, onPaymentComplete, sessionId]);

  const orderStatus = status.data?.orderStatus;
  const totalAmount = status.data?.totalAmount ?? 0;

  return (
    <section className="payment-page">
      <div className="payment-card payment-result-card">
        <p className="product-label">Payment Status</p>

        {status.loading ? (
          <>
            <h2>Finalizing your payment...</h2>
            <p className="helper">
              Stripe redirected you back successfully. Waiting for the server to confirm the order.
            </p>
          </>
        ) : status.error ? (
          <>
            <h2>We could not verify your payment</h2>
            <p className="status error">{status.error}</p>
          </>
        ) : orderStatus === "PAID" ? (
          <>
            <h2>Payment received</h2>
            <p className="status success">
              Order #{status.data.orderId} has been marked as paid.
            </p>
            <p className="helper">Total paid: Rs. {totalAmount}</p>
          </>
        ) : orderStatus === "FAILED" || orderStatus === "EXPIRED" ? (
          <>
            <h2>Payment was not completed</h2>
            <p className="status error">
              Order #{status.data.orderId} is currently marked as {orderStatus.toLowerCase()}.
            </p>
          </>
        ) : (
          <>
            <h2>Payment is still processing</h2>
            <p className="helper">
              We are still waiting for Stripe confirmation. This page refreshes automatically.
            </p>
          </>
        )}

        <div className="payment-actions">
          <button className="secondary-button" type="button" onClick={() => navigate("/cart")}>
            Go to Cart
          </button>
          <Link className="primary payment-button link-button" to="/home">
            Continue Shopping
          </Link>
        </div>
      </div>
    </section>
  );
}

export default PaymentSuccessPage;
