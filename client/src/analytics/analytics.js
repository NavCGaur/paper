// analytics.js
import ReactGA from 'react-ga';

// Initialize Google Analytics with your tracking ID
ReactGA.initialize("G-F7JMZJT1X7");

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
