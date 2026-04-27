import { useEffect, useState } from "react";
import axios from "axios";
import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "../App.css";

function CartPage({ onCartChange }) {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [status, setStatus] = useState({
    loading: true,
    error: "",
  });
  const [removingItemId, setRemovingItemId] = useState(null);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  const fetchCartItems = async () => {
    const token = localStorage.getItem("token");

    if (!baseUrl) {
      setStatus({
        loading: false,
        error: "Missing VITE_BACKEND_URL",
      });
      return;
    }

    if (!token) {
      setStatus({
        loading: false,
        error: "Please log in to view your cart.",
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
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to load cart.";

      setStatus({
        loading: false,
        error: message,
      });
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, [baseUrl]);

  const handleRemoveItem = async (cartItemId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    setRemovingItemId(cartItemId);

    try {
      await axios.delete(`${baseUrl}/cart/${cartItemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
      await onCartChange?.();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to remove item from cart.";

      setStatus((prev) => ({
        ...prev,
        error: message,
      }));
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleQuantityChange = async (cartItemId, action) => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    const selectedItem = cartItems.find((item) => item.cartItemId === cartItemId);
    if (action === "decrease" && selectedItem?.quantity <= 1) {
      await handleRemoveItem(cartItemId);
      return;
    }

    setUpdatingItemId(cartItemId);

    try {
      const response = await axios.patch(
        `${baseUrl}/cart/${cartItemId}/quantity`,
        { action },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setCartItems((prev) =>
        prev.map((item) =>
          item.cartItemId === cartItemId ? response.data : item
        )
      );
      await onCartChange?.();
      setStatus((prev) => ({
        ...prev,
        error: "",
      }));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to update cart quantity.";

      setStatus((prev) => ({
        ...prev,
        error: message,
      }));
    } finally {
      setUpdatingItemId(null);
    }
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <section className="cart-page">
      <div className="cart-header">
        <div>
          <p className="product-label">Shopping Cart</p>
          <h2>Your Cart</h2>
        </div>
        <p className="cart-total">Total: Rs. {totalAmount}</p>
      </div>

      {status.error ? <p className="products-message error">{status.error}</p> : null}

      {status.loading ? (
        <p className="products-message">Loading cart...</p>
      ) : cartItems.length === 0 ? (
        <p className="products-message">Your cart is empty.</p>
      ) : (
        <>
          <div className="cart-list">
            {cartItems.map((item) => (
              <article key={item.cartItemId} className="cart-item">
                <div>
                  <p className="product-label">Product</p>
                  <h3>{item.productName}</h3>
                  <p className="cart-item-meta">Rs. {item.productPrice} each</p>
                </div>
                <div className="cart-item-side">
                  <div className="cart-quantity-controls">
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`Decrease quantity of ${item.productName}`}
                      onClick={() => handleQuantityChange(item.cartItemId, "decrease")}
                      disabled={updatingItemId === item.cartItemId || removingItemId === item.cartItemId}
                    >
                      <FiMinus />
                    </button>
                    <p className="cart-item-meta">Qty: {item.quantity}</p>
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`Increase quantity of ${item.productName}`}
                      onClick={() => handleQuantityChange(item.cartItemId, "increase")}
                      disabled={updatingItemId === item.cartItemId}
                    >
                      <FiPlus />
                    </button>
                  </div>
                  <p className="cart-item-subtotal">Rs. {item.subtotal}</p>
                  <button
                    className="icon-button delete"
                    type="button"
                    aria-label={`Remove ${item.productName} from cart`}
                    onClick={() => handleRemoveItem(item.cartItemId)}
                    disabled={removingItemId === item.cartItemId}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="cart-actions">
            <button
              className="primary payment-button"
              type="button"
              onClick={() => navigate("/checkout/address")}
            >
              Continue
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default CartPage;
