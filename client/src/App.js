import './App.css';
import PaperInterface from './container/paperInterface/index';
import PaperInterface2 from './container/paperInterface2';
import Navbar from './container/navbar/Navbar'
import Header from './container/header/Header'
import PaperInterface3 from './container/paperInterface3';

function App() {
  return (
    <div >
         <div className='gradient__bg'>
          <Navbar />
          <Header />
          <PaperInterface />
          <PaperInterface2 />
          <PaperInterface3 />


        </div>
    </div>
  );
}

export default App;
