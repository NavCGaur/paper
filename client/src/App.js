import './App.css';
import Navbar from './container/navbar/Navbar'
import Header from './container/header/Header'
import FormatChoser from './container/formatChoser';

function App() {
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
