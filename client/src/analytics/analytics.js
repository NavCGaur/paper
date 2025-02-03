import ReactGA from "react-ga";

// Initialize Google Analytics
const TRACKING_ID = "G-F7JMZJT1X7"; 
ReactGA.initialize(TRACKING_ID, { debug: true }); // Enable debug mode for testing

// Track page views
export const trackPageView = () => {
  ReactGA.set({ page: window.location.pathname }); // Set the page
  ReactGA.pageview(window.location.pathname + window.location.search);
};

// Track custom events
export const trackEvent = (category, action, label = "") => {
  if (category && action) {
    ReactGA.event({
      category: category, // Example: "User"
      action: action, // Example: "Clicked Button"
      label: label, // Example: "Download Paper"
    });
  } else {
    console.error("Invalid event tracking: category and action are required.");
  }
};
