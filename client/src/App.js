import './App.css';
import Navbar from './container/navbar/Navbar'
import Header from './container/header/Header'
import FormatChoser from './container/formatChoser';
import QuestionSummary from './container/QuestionSummary';

function App() {
  return (
    <div >
         <div className='gradient__bg'>
          <Navbar />
          <Header />
          <FormatChoser />
          <QuestionSummary />
        </div>
    </div>
  );
}

export default App;
