//React import
import { React, useState } from 'react';

//Style import
import './navbar.css';

//importing react icons
import { RiMenu3Line, RiCloseLine } from 'react-icons/ri';

const Navbar = () => {
const [toggleMenu, setToggleMenu] = useState(false);

function Menu(){
  return(
    <>
    <p><a href='#home'>Home</a></p>
    <p><a href='#price'>Price</a></p>
    <p><a href='#tutorial'>Tutorial</a></p>
    </>

        )
  }

  return (
    <div className='gpt4__navbar'>

      <div className='gpt4__navbar-links'> 

        <div className='gpt4__navbar-links_logo'>
          <h1>Exam Ai</h1>
        </div>

        <div className='gpt4__navbar-links_container'>
           <Menu />
        </div>

      </div>

      <div className='gpt4__navbar-sign'>
          <p>Sign in</p>
          <button type="button">Sign up</button>
      </div>


      <div className='gpt4__navbar-menu'>
          {toggleMenu? 
                      <RiCloseLine color="#fff" size={27} onClick={()=> setToggleMenu(false)} />:
                       <RiMenu3Line color="#fff" size={27} onClick={()=> setToggleMenu(true)} />  
          }
          {toggleMenu && (
          <div className="gpt4__navbar-menu_container scale-up-center">
            <div className="gpt4__navbar-menu_container-links">
              <Menu />

            </div>

            <div className='gpt4__navbar-menu_container-links-sign'>
                    <p>Sign in</p>
                    <button type="button">Sign up</button>
            </div>

          </div>
          )}
      </div>
    </div>
     );
};

export default Navbar