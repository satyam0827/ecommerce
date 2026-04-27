import { useEffect, useState } from "react";
import axios from "axios";
import "../App.css";

const initialAddressForm = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  defaultAddress: false,
};

const getRoleFromToken = (token) => {
  if (!token) {
    return null;
  }

  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const normalizedPayload = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");

    const decodedPayload = JSON.parse(atob(normalizedPayload));
    return decodedPayload?.role ?? null;
  } catch {
    return null;
  }
};

function ProfilePage() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const normalizedBaseUrl = (baseUrl || "").replace(/\/$/, "");
  const token = localStorage.getItem("token");
  const isAdmin = getRoleFromToken(token) === "ADMIN";
  const [form, setForm] = useState({
    name: "",
    email: "",
    profileImageUrl: "",
  });
  const [addressForm, setAddressForm] = useState(initialAddressForm);
  const [addresses, setAddresses] = useState([]);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [status, setStatus] = useState({
    loading: true,
    submitting: false,
    error: "",
    success: "",
  });

  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

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

  const refreshAddresses = async (token) => {
    if (isAdmin) {
      setAddresses([]);
      return;
    }

    const response = await axios.get(`${baseUrl}/addresses`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setAddresses(response.data ?? []);
  };

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("token");

      if (!baseUrl) {
        setStatus({
          loading: false,
          submitting: false,
          error: "Missing VITE_BACKEND_URL",
          success: "",
        });
        return;
      }

      if (!token) {
        setStatus({
          loading: false,
          submitting: false,
          error: "Please log in to view your profile.",
          success: "",
        });
        return;
      }

      try {
        const [profileResponse, addressesResponse] = await Promise.all([
          axios.get(`${baseUrl}/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          isAdmin
            ? Promise.resolve({ data: [] })
            : axios.get(`${baseUrl}/addresses`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }),
        ]);

        setForm({
          name: profileResponse.data?.name ?? "",
          email: profileResponse.data?.email ?? "",
          profileImageUrl: profileResponse.data?.profileImageUrl ?? "",
        });
        setAddresses(addressesResponse.data ?? []);
        setSelectedProfileImage(null);
        setPreviewImageUrl("");
        setStatus({
          loading: false,
          submitting: false,
          error: "",
          success: "",
        });
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load profile.";

        setStatus({
          loading: false,
          submitting: false,
          error: message,
          success: "",
        });
      }
    };

    loadProfile();
  }, [baseUrl, isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    setIsAddressModalOpen(false);
    setEditingAddressId(null);
    setAddressForm(initialAddressForm);
  }, [isAdmin]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleProfileImageChange = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;

    if (selectedFile && !selectedFile.type.startsWith("image/")) {
      setStatus((prev) => ({
        ...prev,
        error: "Only image files are allowed.",
        success: "",
      }));
      event.target.value = "";
      return;
    }

    setSelectedProfileImage(selectedFile);
    setPreviewImageUrl(selectedFile ? URL.createObjectURL(selectedFile) : "");
    setStatus((prev) => ({
      ...prev,
      error: "",
      success: "",
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
        error: "Please log in to update your profile.",
      }));
      return;
    }

    setStatus((prev) => ({
      ...prev,
      submitting: true,
      error: "",
      success: "",
    }));

    try {
      const payload = new FormData();
      payload.append("name", form.name.trim());
      if (selectedProfileImage) {
        payload.append("profileImage", selectedProfileImage);
      }

      const response = await axios.put(`${baseUrl}/users/me`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setForm((prev) => ({
        ...prev,
        name: response.data?.name ?? prev.name,
        profileImageUrl: response.data?.profileImageUrl ?? prev.profileImageUrl,
      }));
      setSelectedProfileImage(null);
      setPreviewImageUrl("");
      setStatus((prev) => ({
        ...prev,
        submitting: false,
        success: "Profile updated successfully.",
      }));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to update profile.";

      setStatus((prev) => ({
        ...prev,
        submitting: false,
        error: message,
        success: "",
      }));
    }
  };

  const openAddAddressModal = () => {
    setEditingAddressId(null);
    setAddressForm({
      ...initialAddressForm,
      defaultAddress: addresses.length === 0,
    });
    setIsAddressModalOpen(true);
    setStatus((prev) => ({
      ...prev,
      error: "",
      success: "",
    }));
  };

  const openEditAddressModal = (address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      fullName: address?.fullName ?? "",
      phone: address?.phone ?? "",
      line1: address?.line1 ?? "",
      line2: address?.line2 ?? "",
      landmark: address?.landmark ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      pincode: address?.pincode ?? "",
      defaultAddress: address?.defaultAddress ?? false,
    });
    setIsAddressModalOpen(true);
    setStatus((prev) => ({
      ...prev,
      error: "",
      success: "",
    }));
  };

  const closeAddressModal = () => {
    if (status.submitting) {
      return;
    }
    setEditingAddressId(null);
    setAddressForm(initialAddressForm);
    setIsAddressModalOpen(false);
  };

  useEffect(() => {
    if (!isAddressModalOpen) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key !== "Escape" || status.submitting) {
        return;
      }

      setEditingAddressId(null);
      setAddressForm(initialAddressForm);
      setIsAddressModalOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAddressModalOpen, status.submitting]);

  const handleAddressSubmit = async (event) => {
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
        error: "Please log in to manage address.",
      }));
      return;
    }

    setStatus((prev) => ({
      ...prev,
      submitting: true,
      error: "",
      success: "",
    }));

    try {
      if (editingAddressId) {
        await axios.put(`${baseUrl}/addresses/${editingAddressId}`, addressForm, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } else {
        await axios.post(`${baseUrl}/addresses`, addressForm, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }

      await refreshAddresses(token);
      closeAddressModal();
      setStatus((prev) => ({
        ...prev,
        submitting: false,
        success: editingAddressId
          ? "Address updated successfully."
          : "Address added successfully.",
      }));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (editingAddressId ? "Failed to update address." : "Failed to add address.");

      setStatus((prev) => ({
        ...prev,
        submitting: false,
        error: message,
        success: "",
      }));
    }
  };

  const handleDeleteAddress = async (addressId) => {
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
        error: "Please log in to delete address.",
      }));
      return;
    }

    setStatus((prev) => ({
      ...prev,
      submitting: true,
      error: "",
      success: "",
    }));

    try {
      await axios.delete(`${baseUrl}/addresses/${addressId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await refreshAddresses(token);
      if (editingAddressId === addressId) {
        closeAddressModal();
      }
      setStatus((prev) => ({
        ...prev,
        submitting: false,
        success: "Address deleted successfully.",
      }));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to delete address.";

      setStatus((prev) => ({
        ...prev,
        submitting: false,
        error: message,
      }));
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
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
        error: "Please log in to set default address.",
      }));
      return;
    }

    setStatus((prev) => ({
      ...prev,
      submitting: true,
      error: "",
      success: "",
    }));

    try {
      await axios.patch(`${baseUrl}/addresses/${addressId}/default`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await refreshAddresses(token);
      setStatus((prev) => ({
        ...prev,
        submitting: false,
        success: "Default address updated successfully.",
      }));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to set default address.";

      setStatus((prev) => ({
        ...prev,
        submitting: false,
        error: message,
      }));
    }
  };

  return (
    <section className="profile-page">
      <div className={`profile-content${isAddressModalOpen ? " modal-open" : ""}`}>
        <div className="profile-card">
          <div className="profile-header">
            <p className="product-label">Account</p>
            <h2>Your Profile</h2>
          </div>

          {status.error ? <p className="status error">{status.error}</p> : null}
          {status.success ? <p className="status success">{status.success}</p> : null}

          {status.loading ? (
            <p className="products-message">Loading profile...</p>
          ) : (
            <form className="form" onSubmit={handleSubmit}>
              <div className="profile-avatar-block">
                {previewImageUrl || form.profileImageUrl ? (
                  <img
                    src={previewImageUrl || resolveImageUrl(form.profileImageUrl)}
                    alt={`${form.name || "User"} profile`}
                    className="profile-avatar"
                  />
                ) : (
                  <div className="profile-avatar-placeholder">No photo</div>
                )}
              </div>

              <label className="field">
                Name
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  required
                />
              </label>

              <label className="field">
                Email
                <input name="email" type="email" value={form.email} readOnly />
              </label>

              <label className="field">
                Profile Photo
                <input
                  name="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                />
              </label>

              <p className="helper">Email is read-only for account security.</p>

              <button className="primary" type="submit" disabled={status.submitting}>
                {status.submitting ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}

          {!isAdmin ? (
            <section className="profile-address-section">
              <div className="profile-address-header">
                <div>
                  <p className="product-label">Addresses</p>
                  <h2>Delivery Addresses</h2>
                </div>
                <button
                  className="primary add-address-button"
                  type="button"
                  onClick={openAddAddressModal}
                  disabled={status.submitting}
                >
                  + Add New Address
                </button>
              </div>

              {addresses.length > 0 ? (
                <div className="profile-address-list">
                  {addresses.map((address) => (
                    <article key={address.id} className="profile-address-item">
                      <div className="profile-address-item-header">
                        <strong>{address.fullName}</strong>
                        {address.defaultAddress ? <span className="checkout-address-badge">Default</span> : null}
                      </div>
                      <p>{address.line1}</p>
                      {address.line2 ? <p>{address.line2}</p> : null}
                      <p>
                        {address.city}, {address.state} - {address.pincode}
                      </p>
                      {address.landmark ? <p>{address.landmark}</p> : null}
                      <p className="cart-item-meta">{address.phone}</p>
                      <div className="profile-address-item-actions">
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => openEditAddressModal(address)}
                          disabled={status.submitting}
                        >
                          Edit
                        </button>
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => handleDeleteAddress(address.id)}
                          disabled={status.submitting}
                        >
                          Delete
                        </button>
                        {!address.defaultAddress ? (
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() => handleSetDefaultAddress(address.id)}
                            disabled={status.submitting}
                          >
                            Set Default
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="products-message">No saved addresses yet.</p>
              )}
            </section>
          ) : null}
        </div>
      </div>

      {isAddressModalOpen && !isAdmin ? (
        <>
          <button
            className="profile-address-modal-backdrop"
            type="button"
            aria-label="Close address modal"
            onClick={closeAddressModal}
          />
          <section className="profile-address-modal" aria-live="polite">
            <div className="profile-address-modal-card">
              <div className="profile-address-header">
                <div>
                  <p className="product-label">Addresses</p>
                  <h2>{editingAddressId ? "Edit Address" : "Add New Address"}</h2>
                </div>
              </div>

              <form className="form address-form" onSubmit={handleAddressSubmit}>
                <div className="address-grid">
                  <label className="field">
                    Full Name
                    <input
                      name="fullName"
                      type="text"
                      value={addressForm.fullName}
                      onChange={handleAddressInputChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </label>

                  <label className="field">
                    Phone Number
                    <input
                      name="phone"
                      type="tel"
                      value={addressForm.phone}
                      onChange={handleAddressInputChange}
                      placeholder="10-digit mobile number"
                      required
                    />
                  </label>

                  <label className="field address-grid-span">
                    Address Line 1
                    <input
                      name="line1"
                      type="text"
                      value={addressForm.line1}
                      onChange={handleAddressInputChange}
                      placeholder="House no., street name"
                      required
                    />
                  </label>

                  <label className="field address-grid-span">
                    Address Line 2
                    <input
                      name="line2"
                      type="text"
                      value={addressForm.line2}
                      onChange={handleAddressInputChange}
                      placeholder="Apartment, suite, area"
                    />
                  </label>

                  <label className="field">
                    Landmark
                    <input
                      name="landmark"
                      type="text"
                      value={addressForm.landmark}
                      onChange={handleAddressInputChange}
                      placeholder="Nearby landmark"
                    />
                  </label>

                  <label className="field">
                    City
                    <input
                      name="city"
                      type="text"
                      value={addressForm.city}
                      onChange={handleAddressInputChange}
                      placeholder="City"
                      required
                    />
                  </label>

                  <label className="field">
                    State
                    <input
                      name="state"
                      type="text"
                      value={addressForm.state}
                      onChange={handleAddressInputChange}
                      placeholder="State"
                      required
                    />
                  </label>

                  <label className="field">
                    Pincode
                    <input
                      name="pincode"
                      type="text"
                      value={addressForm.pincode}
                      onChange={handleAddressInputChange}
                      placeholder="Postal code"
                      required
                    />
                  </label>
                </div>

                <label className="checkbox-field">
                  <input
                    name="defaultAddress"
                    type="checkbox"
                    checked={addressForm.defaultAddress}
                    onChange={handleAddressInputChange}
                  />
                  <span>Save as default address</span>
                </label>

                <div className="profile-address-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={closeAddressModal}
                    disabled={status.submitting}
                  >
                    Cancel
                  </button>
                  <button className="primary" type="submit" disabled={status.submitting}>
                    {status.submitting
                      ? "Saving..."
                      : editingAddressId
                        ? "Update Address"
                        : "Add Address"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}

export default ProfilePage;
