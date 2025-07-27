// This is your secure, server-side function.
// It uses your secret Stripe key to create a checkout session.

// This line imports the official Stripe software package.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// This is the main function that Netlify will run when your website calls it.
exports.handler = async (event) => {
  // We're receiving the cart data from the browser.
  // The 'event.body' contains the cart array we sent.
  const { cart } = JSON.parse(event.body);

  // This part formats the cart items into the structure that Stripe's API requires.
  const lineItems = cart.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.name,
      },
      // Stripe requires the price to be in the smallest currency unit (cents).
      // So, we multiply the dollar price by 100.
      unit_amount: Math.round(item.price * 100), 
    },
    quantity: item.quantity,
  }));

  // This is the URL of your website. Netlify automatically provides this.
  // It's used to tell Stripe where to redirect the customer after payment.
  const YOUR_DOMAIN = process.env.URL;

  try {
    // Here, we ask Stripe to create a new Checkout Session.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      // If payment is successful, Stripe will send the customer to this URL.
      success_url: `${YOUR_DOMAIN}/?success=true`, 
      // If the customer cancels, Stripe will send them back to this URL.
      cancel_url: `${YOUR_DOMAIN}/?canceled=true`,  
    });

    // If the session is created successfully, we send its unique ID back to the browser.
    return {
      statusCode: 200,
      body: JSON.stringify({ id: session.id }),
    };
  } catch (error) {
    // If something goes wrong, we log the error and send back an error message.
    console.error("Error creating Stripe session:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create checkout session' }),
    };
  }
};
