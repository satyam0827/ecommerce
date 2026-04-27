import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

function AdminOrdersPage() {
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const [status, setStatus] = useState({
    loading: true,
    error: "",
  });
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!baseUrl) {
      setStatus({
        loading: false,
        error: "Missing VITE_BACKEND_URL",
      });
      return;
    }

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const loadOrders = async () => {
      try {
        const response = await axios.get(`${baseUrl}/admin/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setOrders(response.data);
        setStatus({
          loading: false,
          error: "",
        });
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load admin orders.";

        setStatus({
          loading: false,
          error: message,
        });
      }
    };

    loadOrders();
  }, [baseUrl, navigate]);

  return (
    <section className="admin-page">
      <div className="admin-header">
        <div>
          <p className="product-label">Admin Management</p>
          <h2>Orders and Payment Status</h2>
        </div>
      </div>

      {status.error ? <p className="products-message error">{status.error}</p> : null}

      {status.loading ? (
        <p className="products-message">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="products-message">No orders found.</p>
      ) : (
        <div className="admin-orders-list">
          {orders.map((order) => (
            <article key={order.orderId} className="admin-order-card">
              <div className="admin-order-header">
                <div>
                  <p className="product-label">Order #{order.orderId}</p>
                  <h3>{order.customerName}</h3>
                  <p className="helper">{order.customerEmail}</p>
                </div>
                <div className="admin-order-statuses">
                  <span className="status-chip">{order.orderStatus}</span>
                  <span className="status-chip secondary">{order.paymentStatus || "UNKNOWN"}</span>
                </div>
              </div>

              <div className="admin-order-grid">
                <p><strong>Total:</strong> Rs. {order.totalAmount}</p>
                <p><strong>Currency:</strong> {order.currency}</p>
                <p><strong>Session:</strong> {order.sessionStatus || "UNKNOWN"}</p>
                <p><strong>Paid At:</strong> {order.paidAt || "Not paid yet"}</p>
                <p><strong>Created:</strong> {order.createdAt}</p>
                <p><strong>Phone:</strong> {order.phone}</p>
              </div>

              <div className="admin-order-address">
                <p className="product-label">Delivery Address</p>
                <p>
                  {order.line1}
                  {order.line2 ? `, ${order.line2}` : ""}
                  {order.landmark ? `, ${order.landmark}` : ""}
                  {`, ${order.city}, ${order.state} - ${order.pincode}`}
                </p>
              </div>

              <div className="admin-order-meta">
                <p><strong>Stripe Session ID:</strong> {order.stripeSessionId || "N/A"}</p>
                <p><strong>Payment Intent:</strong> {order.stripePaymentIntentId || "N/A"}</p>
              </div>

              <div className="admin-order-items">
                <p className="product-label">Items</p>
                {order.items.map((item) => (
                  <div key={`${order.orderId}-${item.productId}-${item.productName}`} className="admin-order-item">
                    <span>{item.productName}</span>
                    <span>
                      {item.quantity} x Rs. {item.unitPrice} = Rs. {item.subtotal}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminOrdersPage;
