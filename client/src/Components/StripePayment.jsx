export const redirectToStripeCheckout = (checkoutUrl) => {
  if (!checkoutUrl) {
    throw new Error("Missing Stripe checkout URL.");
  }

  window.location.assign(checkoutUrl);
};

