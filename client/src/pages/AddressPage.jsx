import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

const CHECKOUT_ADDRESS_KEY = "checkoutAddress";

const initialForm = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  defaultAddress: true,
};

const toAddressForm = (address = {}) => ({
  fullName: address.fullName ?? "",
  phone: address.phone ?? "",
  line1: address.line1 ?? "",
  line2: address.line2 ?? "",
  landmark: address.landmark ?? "",
  city: address.city ?? "",
  state: address.state ?? "",
  pincode: address.pincode ?? "",
  defaultAddress: address.defaultAddress ?? true,
});

function AddressPage() {
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const [cartItems, setCartItems] = useState([]);
  const [form, setForm] = useState(() => {
    const cachedAddress = sessionStorage.getItem(CHECKOUT_ADDRESS_KEY);

    if (!cachedAddress) {
      return initialForm;
    }

    try {
      return toAddressForm(JSON.parse(cachedAddress));
    } catch {
      sessionStorage.removeItem(CHECKOUT_ADDRESS_KEY);
      return initialForm;
    }
  });
  const [status, setStatus] = useState({
    loading: true,
    submitting: false,
    error: "",
  });

  useEffect(() => {
    const fetchCartItems = async () => {
      const token = localStorage.getItem("token");

      if (!baseUrl) {
        setStatus({
          loading: false,
          submitting: false,
          error: "Missing VITE_BACKEND_URL",
        });
        return;
      }

      if (!token) {
        setStatus({
          loading: false,
          submitting: false,
          error: "Please log in to continue checkout.",
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
          submitting: false,
          error: "",
        });
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load your cart for checkout.";

        setStatus({
          loading: false,
          submitting: false,
          error: message,
        });
      }
    };

    fetchCartItems();
  }, [baseUrl]);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("token");

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
        error: "Please log in to continue checkout.",
      }));
      return;
    }

    setStatus((prev) => ({
      ...prev,
      submitting: true,
      error: "",
    }));

    try {
      const response = await axios.post(`${baseUrl}/addresses`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      sessionStorage.setItem(CHECKOUT_ADDRESS_KEY, JSON.stringify(response.data));
      navigate("/payment", {
        state: {
          address: response.data,
        },
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to save address.";

      setStatus((prev) => ({
        ...prev,
        submitting: false,
        error: message,
      }));
    }
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const hasCartItems = !status.loading && cartItems.length > 0;

  return (
    <section className="address-page">
      <div className={`checkout-layout${hasCartItems ? " has-cart-items" : ""}`}>
        <div className="address-card">
          <div className="payment-header">
            <div>
              <p className="product-label">Checkout</p>
              <h2>Add Delivery Address</h2>
            </div>
            <p className="cart-total">Total: Rs. {totalAmount}</p>
          </div>

          {status.error ? <p className="products-message error">{status.error}</p> : null}

          {status.loading ? (
            <p className="products-message">Loading checkout details...</p>
          ) : cartItems.length === 0 ? (
            <div className="checkout-empty">
              <p className="products-message">Your cart is empty. Add items before checkout.</p>
              <button
                className="secondary-button"
                type="button"
                onClick={() => navigate("/cart")}
              >
                Back to Cart
              </button>
            </div>
          ) : (
            <form className="form address-form" onSubmit={handleSubmit}>
              <div className="address-grid">
                <label className="field">
                  Full Name
                  <input
                    name="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                </label>

                <label className="field">
                  Phone Number
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    required
                  />
                </label>

                <label className="field address-grid-span">
                  Address Line 1
                  <input
                    name="line1"
                    type="text"
                    value={form.line1}
                    onChange={handleInputChange}
                    placeholder="House no., street name"
                    required
                  />
                </label>

                <label className="field address-grid-span">
                  Address Line 2
                  <input
                    name="line2"
                    type="text"
                    value={form.line2}
                    onChange={handleInputChange}
                    placeholder="Apartment, suite, area"
                  />
                </label>

                <label className="field">
                  Landmark
                  <input
                    name="landmark"
                    type="text"
                    value={form.landmark}
                    onChange={handleInputChange}
                    placeholder="Nearby landmark"
                  />
                </label>

                <label className="field">
                  City
                  <input
                    name="city"
                    type="text"
                    value={form.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    required
                  />
                </label>

                <label className="field">
                  State
                  <input
                    name="state"
                    type="text"
                    value={form.state}
                    onChange={handleInputChange}
                    placeholder="State"
                    required
                  />
                </label>

                <label className="field">
                  Pincode
                  <input
                    name="pincode"
                    type="text"
                    value={form.pincode}
                    onChange={handleInputChange}
                    placeholder="Postal code"
                    required
                  />
                </label>
              </div>

              <label className="checkbox-field">
                <input
                  name="defaultAddress"
                  type="checkbox"
                  checked={form.defaultAddress}
                  onChange={handleInputChange}
                />
                <span>Save as default address</span>
              </label>

              <div className="payment-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => navigate("/cart")}
                  disabled={status.submitting}
                >
                  Back to Cart
                </button>
                <button className="primary payment-button" type="submit" disabled={status.submitting}>
                  {status.submitting ? "Saving..." : "Continue to Payment"}
                </button>
              </div>
            </form>
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

export default AddressPage;
