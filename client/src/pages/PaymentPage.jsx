import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { redirectToStripeCheckout } from "../Components/StripePayment.jsx";
import "../App.css";

const CHECKOUT_ADDRESS_KEY = "checkoutAddress";

function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [address, setAddress] = useState(null);
  const [status, setStatus] = useState({
    loading: true,
    error: "",
    info: "",
    submitting: false,
  });

  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  const pickPreferredAddress = (addresses = []) => {
    if (!addresses.length) {
      return null;
    }
    return addresses.find((item) => item.defaultAddress) || addresses[0];
  };

  useEffect(() => {
    const loadAddress = async () => {
      const savedAddress = location.state?.address;

      if (savedAddress) {
        setAddress(savedAddress);
        sessionStorage.setItem(CHECKOUT_ADDRESS_KEY, JSON.stringify(savedAddress));
        return;
      }

      const cachedAddress = sessionStorage.getItem(CHECKOUT_ADDRESS_KEY);

      if (cachedAddress) {
        try {
          setAddress(JSON.parse(cachedAddress));
          return;
        } catch {
          sessionStorage.removeItem(CHECKOUT_ADDRESS_KEY);
        }
      }

      const token = localStorage.getItem("token");
      if (!baseUrl || !token) {
        return;
      }

      try {
        const response = await axios.get(`${baseUrl}/addresses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const preferredAddress = pickPreferredAddress(response.data);
        if (!preferredAddress) {
          return;
        }

        setAddress(preferredAddress);
        sessionStorage.setItem(CHECKOUT_ADDRESS_KEY, JSON.stringify(preferredAddress));
      } catch {
        // Keep existing flow: user can add address from checkout screen.
      }
    };

    loadAddress();
  }, [baseUrl, location.state]);

  useEffect(() => {
    const fetchCartItems = async () => {
      const token = localStorage.getItem("token");

      if (!baseUrl) {
        setStatus({
          loading: false,
          error: "Missing VITE_BACKEND_URL",
          info: "",
          submitting: false,
        });
        return;
      }

      if (!token) {
        setStatus({
          loading: false,
          error: "Please log in to continue to payment.",
          info: "",
          submitting: false,
        });
        return;
      }

      try {
        const response = await axios.get(`${baseUrl}/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setCartItems(response.data);
        setStatus({
          loading: false,
          error: "",
          info: "",
          submitting: false,
        });
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load payment summary.";

        setStatus({
          loading: false,
          error: message,
          info: "",
          submitting: false,
        });
      }
    };

    fetchCartItems();
  }, [baseUrl]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    if (searchParams.get("cancelled") === "true") {
      setStatus((prev) => ({
        ...prev,
        info: "",
        error: "Payment was cancelled. You can review your order and try again.",
        submitting: false,
      }));
    }
  }, [location.search]);

  const totalAmount = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const hasCartItems = !status.loading && cartItems.length > 0;

  const handlePayNow = async () => {
    const token = localStorage.getItem("token");

    if (!address?.id) {
      setStatus((prev) => ({
        ...prev,
        error: "Select a delivery address before starting payment.",
      }));
      return;
    }

    if (!baseUrl) {
      setStatus((prev) => ({
        ...prev,
        error: "Missing VITE_BACKEND_URL",
      }));
      return;
    }

    if (!token) {
      setStatus((prev) => ({
        ...prev,
        error: "Please log in to continue to payment.",
      }));
      return;
    }

    setStatus((prev) => ({
      ...prev,
      submitting: true,
      error: "",
      info: "Redirecting to Stripe Checkout...",
    }));

    try {
      const response = await axios.post(
        `${baseUrl}/payments/checkout-session`,
        { addressId: address.id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      redirectToStripeCheckout(response.data?.checkoutUrl);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to start payment.";

      setStatus((prev) => ({
        ...prev,
        submitting: false,
        info: "",
        error: message,
      }));
    }
  };

  return (
    <section className="payment-page">
      <div className={`checkout-layout${hasCartItems ? " has-cart-items" : ""}`}>
        <div className="payment-card">
          <div className="payment-header">
            <div>
            <p className="product-label">Checkout</p>
            <h2>Payment Summary</h2>
            </div>
            <p className="cart-total">Total: Rs. {totalAmount}</p>
          </div>

          {status.error ? <p className="products-message error">{status.error}</p> : null}
          {status.info ? <p className="status success">{status.info}</p> : null}
          {!status.loading && !address ? (
            <p className="status error">
              Add a delivery address before continuing to payment.
            </p>
          ) : null}

          {status.loading ? (
            <p className="products-message">Loading payment details...</p>
          ) : cartItems.length === 0 ? (
            <p className="products-message">Your cart is empty. Add items before payment.</p>
          ) : (
            <>
              {address ? (
                <div className="checkout-address-summary">
                  <div className="checkout-address-summary-header">
                    <div>
                      <p className="product-label">Deliver To</p>
                      <h3>{address.fullName}</h3>
                    </div>
                    {address.defaultAddress ? (
                      <span className="checkout-address-badge">Default</span>
                    ) : null}
                  </div>
                  <p>{address.fullAddress || address.line1}</p>
                  <p className="cart-item-meta">{address.phone}</p>
                </div>
              ) : null}

              <div className="payment-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => navigate("/cart")}
                >
                  Back to Cart
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => navigate("/checkout/address")}
                >
                  {address ? "Change Address" : "Add Address"}
                </button>
                <button
                  className="primary payment-button"
                  type="button"
                  onClick={handlePayNow}
                  disabled={!address || status.submitting}
                >
                  {status.submitting ? "Redirecting..." : "Pay Now"}
                </button>
              </div>
            </>
          )}
        </div>

        {hasCartItems ? (
          <aside className="checkout-cart-rail">
            <div className="checkout-cart-rail-header">
              <p className="product-label">Order Snapshot</p>
              <h3>Review Items</h3>
            </div>
            <div className="checkout-cart-rail-list">
              {cartItems.map((item) => (
                <article key={item.cartItemId} className="cart-item checkout-cart-item">
                  <div>
                    <p className="product-label">Product</p>
                    <h3>{item.productName}</h3>
                    <p className="cart-item-meta">Rs. {item.productPrice} each</p>
                  </div>
                  <div className="cart-item-side">
                    <p className="cart-item-meta">Qty: {item.quantity}</p>
                    <p className="cart-item-subtotal">Rs. {item.subtotal}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="checkout-summary-total">
              <span>Total payable</span>
              <strong>Rs. {totalAmount}</strong>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}

export default PaymentPage;
