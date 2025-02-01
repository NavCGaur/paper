// App.js
import React, { useEffect } from 'react';
import { trackPageView } from './analytics';
import Navbar from './Navbar';
import Header from './Header';
import FormatChoser from './FormatChoser';

function App() {
  useEffect(() => {
    trackPageView();
  }, []);

  return (
    <div>
      <div className='gradient__bg'>
        <Navbar />
        <Header />
        <FormatChoser />
      </div>
    </div>
  );
}

export default App;
