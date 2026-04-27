import { FiShoppingCart } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

function NavBar({ isAuthenticated, isAdmin, cartCount, onLogOut }) {
  const navigate = useNavigate();

  const handleAuthClick = () => {
    if (isAuthenticated) {
      onLogOut?.();
      return;
    }

    navigate("/login");
  };

  return (
    <nav className="nav-bar">
      <h3 onClick={() => navigate(("/home"))}>E-Com</h3>
      <div className="nav-actions">
        {isAdmin ? (
          <button className="secondary-button" type="button" onClick={() => navigate("/admin")}>
            Admin
          </button>
        ) : null}

        {isAuthenticated && !isAdmin ? (
          <button
            className="icon-button nav-cart-button"
            type="button"
            aria-label={`Open cart with ${cartCount} items`}
            onClick={() => navigate("/cart")}
          >
            <FiShoppingCart />
            <span className="cart-badge">{cartCount}</span>
          </button>
        ) : null}

        {isAuthenticated ? (
          <button className="secondary-button" type="button" onClick={() => navigate("/profile")}>
            Profile
          </button>
        ) : null}

        <button className="primary" type="button" onClick={handleAuthClick}>
          {isAuthenticated ? "Logout" : "Login"}
        </button>
      </div>
    </nav>
  );
}

export default NavBar;
