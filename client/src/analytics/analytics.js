// analytics.js
import ReactGA from 'react-ga';

// Initialize Google Analytics with your tracking ID
ReactGA.initialize('YOUR_GOOGLE_ANALYTICS_TRACKING_ID');

// Track page view
export const trackPageView = () => {
  ReactGA.pageview(window.location.pathname + window.location.search);
};

// Track custom events
export const trackEvent = (category, action, label) => {
  ReactGA.event({
    category: category,
    action: action,
    label: label
  });
};
