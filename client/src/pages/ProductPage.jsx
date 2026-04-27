import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { FiEdit2, FiMinus, FiPlus, FiShoppingCart, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const initialForm = {
  pName: "",
  pPrice: "",
  image: null,
};

function ProductPage({ isAuthenticated, isAdmin, onCartChange }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartProductIds, setCartProductIds] = useState(new Set());
  const [cartItems, setCartItems] = useState([]);
  const [cartSubmittingId, setCartSubmittingId] = useState(null);
  const [cartUpdatingItemId, setCartUpdatingItemId] = useState(null);
  const [cartPopup, setCartPopup] = useState({
    message: "",
    tone: "success",
  });
  const cartPopupTimeoutRef = useRef(null);
  const [status, setStatus] = useState({
    loading: true,
    error: "",
  });
  const [editor, setEditor] = useState({
    mode: null,
    productId: null,
    form: initialForm,
    submitting: false,
    error: "",
  });

  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const normalizedBaseUrl = (baseUrl || "").replace(/\/$/, "");

  const resolveImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return "";
    }

    if (/^https?:\/\//i.test(imageUrl)) {
      return imageUrl;
    }

    if (!normalizedBaseUrl) {
      return imageUrl;
    }

    return imageUrl.startsWith("/")
      ? `${normalizedBaseUrl}${imageUrl}`
      : `${normalizedBaseUrl}/${imageUrl}`;
  };

  const fetchCartItems = async () => {
    const token = localStorage.getItem("token");

    if (!baseUrl || !isAuthenticated || !token) {
      setCartProductIds(new Set());
      setCartItems([]);
      return;
    }

    try {
      const response = await axios.get(`${baseUrl}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCartItems(response.data);
      setCartProductIds(new Set(response.data.map((item) => item.productId)));
    } catch {
      setCartProductIds(new Set());
      setCartItems([]);
    }
  };

  const fetchProducts = async (query = "") => {
    if (!baseUrl) {
      setStatus({
        loading: false,
        error: "Missing VITE_BACKEND_URL",
      });
      return;
    }

    try {
      const res = await axios.get(`${baseUrl}/products`, {
        params: query.trim() ? { query: query.trim() } : {},
      });
      setProducts(res.data);
      setStatus({
        loading: false,
        error: "",
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to load products";
      setStatus({
        loading: false,
        error: message,
      });
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchProducts(searchTerm);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [baseUrl, searchTerm]);

  useEffect(() => {
    fetchCartItems();
  }, [baseUrl, isAuthenticated]);

  useEffect(() => {
    return () => {
      if (cartPopupTimeoutRef.current) {
        window.clearTimeout(cartPopupTimeoutRef.current);
      }
    };
  }, []);

  const showCartPopup = (message, tone = "success") => {
    if (cartPopupTimeoutRef.current) {
      window.clearTimeout(cartPopupTimeoutRef.current);
    }

    setCartPopup({ message, tone });
    cartPopupTimeoutRef.current = window.setTimeout(() => {
      setCartPopup((prev) => ({ ...prev, message: "" }));
      cartPopupTimeoutRef.current = null;
    }, 2500);
  };

  const resetEditor = useCallback(() => {
    setEditor({
      mode: null,
      productId: null,
      form: initialForm,
      submitting: false,
      error: "",
    });
  }, []);

  const openAddProduct = () => {
    setEditor({
      mode: "add",
      productId: null,
      form: initialForm,
      submitting: false,
      error: "",
    });
  };

  const openEditProduct = (product) => {
    setEditor({
      mode: "edit",
      productId: product.pId,
      form: {
        pName: product.pName,
        pPrice: String(product.pPrice),
        image: null,
      },
      submitting: false,
      error: "",
    });
  };

  useEffect(() => {
    if (!editor.mode) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") {
        return;
      }
      resetEditor();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor.mode, resetEditor]);

  const handleEditorChange = (event) => {
    const { name, value } = event.target;
    setEditor((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        [name]: value,
      },
    }));
  };

  const handleEditorImageChange = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;

    if (selectedFile && !selectedFile.type.startsWith("image/")) {
      setEditor((prev) => ({
        ...prev,
        error: "Only image files are allowed.",
      }));
      event.target.value = "";
      return;
    }

    setEditor((prev) => ({
      ...prev,
      error: "",
      form: {
        ...prev.form,
        image: selectedFile,
      },
    }));
  };

  const handleEditorSubmit = async (event) => {
    event.preventDefault();

    if (!isAdmin) {
      setEditor((prev) => ({
        ...prev,
        error: "Only admins can add or edit products.",
      }));
      return;
    }

    if (!baseUrl) {
      setEditor((prev) => ({
        ...prev,
        error: "Missing VITE_BACKEND_URL",
      }));
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setEditor((prev) => ({
        ...prev,
        error: "You must be logged in to modify products.",
      }));
      return;
    }

    setEditor((prev) => ({
      ...prev,
      submitting: true,
      error: "",
    }));

    try {
      const payload = new FormData();
      payload.append("pName", editor.form.pName.trim());
      payload.append("pPrice", String(Number(editor.form.pPrice)));
      if (editor.form.image) {
        payload.append("image", editor.form.image);
      }

      if (editor.mode === "add") {
        await axios.post(`${baseUrl}/products`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        await axios.put(`${baseUrl}/products/${editor.productId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      await fetchProducts(searchTerm);
      resetEditor();
    } catch (error) {
      const isAuthFailure =
        error?.response?.status === 401 || error?.response?.status === 403;
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (isAuthFailure
          ? "Your session is missing or expired. Please log in again."
          : null) ||
        "Failed to save product.";

      setEditor((prev) => ({
        ...prev,
        submitting: false,
        error: message,
      }));
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!isAdmin) {
      setStatus((prev) => ({
        ...prev,
        error: "Only admins can delete products.",
      }));
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setStatus((prev) => ({
        ...prev,
        error: "You must be logged in to delete a product.",
      }));
      return;
    }

    const shouldDelete = window.confirm("Delete this product?");
    if (!shouldDelete) {
      return;
    }

    try {
      await axios.delete(`${baseUrl}/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProducts((prev) => prev.filter((product) => product.pId !== productId));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to delete product.";

      setStatus((prev) => ({
        ...prev,
        error: message,
      }));
    }
  };

  const handleAddToCart = async (productId) => {
    if (!baseUrl) {
      setStatus((prev) => ({
        ...prev,
        error: "Missing VITE_BACKEND_URL",
      }));
      return;
    }

    const token = localStorage.getItem("token");
    if (!isAuthenticated || !token) {
      setStatus((prev) => ({
        ...prev,
        error: "Please log in to add products to your cart.",
      }));
      return;
    }

    if (cartProductIds.has(productId)) {
      showCartPopup(
        "Product is already in your cart. Update quantity from the cart page.",
        "info"
      );
      return;
    }

    setCartSubmittingId(productId);

    try {
      await axios.post(
        `${baseUrl}/cart/${productId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchCartItems();
      await onCartChange?.();
      showCartPopup("Product added to cart.");
      setStatus((prev) => ({
        ...prev,
        error: "",
      }));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to add product to cart.";

      if (message.includes("already added")) {
        showCartPopup(message, "info");
      }

      setStatus((prev) => ({
        ...prev,
        error: message.includes("already added") ? "" : message,
      }));
    } finally {
      setCartSubmittingId(null);
    }
  };

  const handleBuyNow = (productId) => {
    sessionStorage.setItem("pendingBuyNow", JSON.stringify({ productId }));
    navigate("/login");
  };

  const handleCartRailQuantityChange = async (cartItemId, action) => {
    const token = localStorage.getItem("token");

    if (!baseUrl || !token) {
      return;
    }

    const selectedItem = cartItems.find((item) => item.cartItemId === cartItemId);
    if (action === "decrease" && selectedItem?.quantity <= 1) {
      try {
        await axios.delete(`${baseUrl}/cart/${cartItemId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
        if (selectedItem?.productId) {
          setCartProductIds((prev) => {
            const next = new Set(prev);
            next.delete(selectedItem.productId);
            return next;
          });
        }
        await onCartChange?.();
        setStatus((prev) => ({
          ...prev,
          error: "",
        }));
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to remove item from cart.";

        setStatus((prev) => ({
          ...prev,
          error: message,
        }));
      }
      return;
    }

    setCartUpdatingItemId(cartItemId);

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
      setCartUpdatingItemId(null);
    }
  };

  const cartTotalAmount = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const showCartRail = !isAdmin && isAuthenticated && cartItems.length > 0;

  if (status.loading) {
    return (
      <div className="products-div">
        <p className="products-message">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="products-div">
      {cartPopup.message ? (
        <div className={`cart-popup ${cartPopup.tone}`} role="status" aria-live="polite">
          {cartPopup.message}
        </div>
      ) : null}

      <div className={`products-content${editor.mode ? " modal-open" : ""}`}>
        {status.error ? <p className="products-message error">{status.error}</p> : null}

        <div className={`products-layout${showCartRail ? " with-cart-rail" : ""}`}>
          <div className="products-main">
            <div className="products-toolbar">
              <label className="field product-search">
                <span>Search products</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by product name"
                />
              </label>
            </div>

            <div className="products-card">
              {products.length === 0 ? (
                <p className="products-message">No products found.</p>
              ) : (
                products.map((product) => (
                  <article key={product.pId} className="product-item">
                    {product.imageUrl ? (
                      <img
                        src={resolveImageUrl(product.imageUrl)}
                        alt={product.pName}
                        className="product-image"
                        loading="lazy"
                      />
                    ) : (
                      <div className="product-image-placeholder">No image</div>
                    )}
                    <div className="product-item-header">
                      <div>
                        <p className="product-label">Product</p>
                        <h3>{product.pName}</h3>
                      </div>
                      {isAdmin ? (
                        <div className="product-actions">
                          <button
                            className="icon-button"
                            type="button"
                            aria-label={`Edit ${product.pName}`}
                            onClick={() => openEditProduct(product)}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            className="icon-button delete"
                            type="button"
                            aria-label={`Delete ${product.pName}`}
                            onClick={() => handleDeleteProduct(product.pId)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <div className="product-item-footer">
                      <p className="product-price">Rs. {product.pPrice}</p>
                      {!isAdmin ? (
                        isAuthenticated ? (
                          <button
                            className="primary cart-button"
                            type="button"
                            onClick={() => handleAddToCart(product.pId)}
                            disabled={cartSubmittingId === product.pId}
                          >
                            <FiShoppingCart />
                            {cartSubmittingId === product.pId ? "Adding..." : "Add to Cart"}
                          </button>
                        ) : (
                          <button
                            className="primary cart-button"
                            type="button"
                            onClick={() => handleBuyNow(product.pId)}
                          >
                            <FiShoppingCart />
                            Buy Now
                          </button>
                        )
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>

            {isAdmin ? (
              <div className="products-footer">
                <button className="primary add-product-button" type="button" onClick={openAddProduct}>
                  Add Product
                </button>
              </div>
            ) : null}
          </div>

          {showCartRail ? (
            <aside className="products-cart-rail">
              <div>
                <p className="product-label">In your cart</p>
                <h3>Cart details</h3>
              </div>
              <div className="products-cart-rail-list">
                {cartItems.map((item) => (
                  <article key={item.cartItemId} className="cart-item products-cart-item">
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
                          onClick={() => handleCartRailQuantityChange(item.cartItemId, "decrease")}
                          disabled={cartUpdatingItemId === item.cartItemId}
                        >
                          <FiMinus />
                        </button>
                        <p className="cart-item-meta">Qty: {item.quantity}</p>
                        <button
                          className="icon-button"
                          type="button"
                          aria-label={`Increase quantity of ${item.productName}`}
                          onClick={() => handleCartRailQuantityChange(item.cartItemId, "increase")}
                          disabled={cartUpdatingItemId === item.cartItemId}
                        >
                          <FiPlus />
                        </button>
                      </div>
                      <p className="cart-item-subtotal">Rs. {item.subtotal}</p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="checkout-summary-total">
                <span>Subtotal</span>
                <strong>Rs. {cartTotalAmount}</strong>
              </div>
              <button className="primary payment-button" type="button" onClick={() => navigate("/cart")}>
                Go to Cart
              </button>
            </aside>
          ) : null}
        </div>
      </div>

      {editor.mode ? (
        <>
          <button
            className="product-editor-backdrop"
            type="button"
            aria-label="Close product editor"
            onClick={resetEditor}
          />
          <section className="product-editor" aria-live="polite">
          <div className="product-editor-card">
            <div className="product-editor-header">
              <div>
                <p className="product-label">
                  {editor.mode === "add" ? "Create" : "Update"}
                </p>
                <h3>{editor.mode === "add" ? "Add Product" : "Edit Product"}</h3>
              </div>
              <button className="secondary-button" type="button" onClick={resetEditor}>
                Cancel
              </button>
            </div>

            <form className="editor-form" onSubmit={handleEditorSubmit}>
              <label className="field">
                <span>Product Name</span>
                <input
                  type="text"
                  name="pName"
                  value={editor.form.pName}
                  onChange={handleEditorChange}
                  placeholder="Enter product name"
                  required
                />
              </label>

              <label className="field">
                <span>Price</span>
                <input
                  type="number"
                  name="pPrice"
                  value={editor.form.pPrice}
                  onChange={handleEditorChange}
                  placeholder="Enter product price"
                  min="0"
                  required
                />
              </label>

              <label className="field">
                <span>Product Image</span>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleEditorImageChange}
                />
              </label>

              {editor.error ? <p className="status error">{editor.error}</p> : null}

              <button className="primary" type="submit" disabled={editor.submitting}>
                {editor.submitting
                  ? "Saving..."
                  : editor.mode === "add"
                    ? "Add Product"
                    : "Update Product"}
              </button>
            </form>
          </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default ProductPage;
