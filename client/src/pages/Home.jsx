import "../App.css";
import ProductPage from "./ProductPage.jsx";

function Home({ isAuthenticated, isAdmin, onCartChange }) {
  return (
    <div className="home-shell">
      <ProductPage
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        onCartChange={onCartChange}
      />
    </div>
  );
}

export default Home;
