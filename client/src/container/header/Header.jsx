//React import
import React from 'react';

//Style import
import './header.css';

import ai from '../../assets/examai.png'
import tickmark from '../../assets/tickmark.png'


const Header = () => {
  return (
      <div>
      <div className="gpt4__header " id="home">
        <div className='gpt4__header-content'>

          <h1 className='gradient__text'>Unlimited Free Question Papers </h1>

          <div className='gpt4__header-features'>
            <img src={tickmark} ></img>
            <p>Zero Typing.  </p>
          </div>

          <div className='gpt4__header-features'>
            <img src={tickmark} ></img>
            <p>Downloadable in Word Format.  </p>
          </div>
         
          <div className='gpt4__header-features'>
            <img src={tickmark} ></img>
            <p>Time Saver - Instantly generates question papers.  </p>
          </div>

          <div className='gpt4__header-features'>
            <img src={tickmark} ></img>
            <p>Create Question Paper for Classes 1 to 12, CBSE, All Subjects.  </p>
          </div>         


          <div className='gpt4__header-features'>
            <p className='gradient__text'>Our AI powered app Instantly generates high-quality, NEP-aligned question papers. </p>
          </div>  

         
        </div>


          <div className='gpt4__header-image'>
            <div className='gpt4__header-imageContainer'>  
              <img src={ai} alt='ai' />
              <div className='gpt4__header-features-cta'>
                <button className="gpt4__cta-button" type='button'>
                  Make Your Paper
                </button>  
              </div>
            </div>            
          </div>


      </div>

     
    
      </div>
      
  
  )
}

export default Header
