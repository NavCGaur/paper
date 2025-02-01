import React, { useEffect } from 'react';
import './App.css';
import Navbar from './container/navbar/Navbar'
import Header from './container/header/Header'
import FormatChoser from './container/formatChoser';
import { trackPageView } from './analytics/analytics';


function App() {

  useEffect(() => {
    trackPageView();
  }, []);
  
  return (
    <div >
         <div className='gradient__bg'>
          <Navbar />
          <Header />
          <FormatChoser />
        </div>
    </div>
  );
}

export default App;
