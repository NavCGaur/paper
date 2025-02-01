import React, { useState } from 'react';
import { Modal} from '@mui/material';

import './index.css';
import FormatOne from '../../assets/formatone.png'
import FormatTwo from '../../assets/formattwo.png'
import PaperInterface2 from '../paperInterface2';
import PaperInterface3 from '../paperInterface3';





const FormatChoser = () => {
    const [openModal, setOpenModal] = useState(false);
    const [modalContent, setModalContent] = useState(null);
  
    const handleOpenModal = (content) => {

      trackEvent('User', 'Clicked FormatChoser Button', 'FormatChoser Button');
      setModalContent(content);
      setOpenModal(true);
    };
  
    const handleCloseModal = () => {
      setOpenModal(false);
      setModalContent(null);
    };
  
    return (
      <div className="container" id='formatChoser'>
        <h2>Choose Word Document Format</h2>
  
        <div className="format-grid">
          {/* Format Option 1 */}
          <div className="format-card">
            <img 
              src={FormatOne} 
              alt="Standard Format" 
              className="format-image"
            />
            <h5 className="format-title">Word Document without Cells and Tables</h5>
            <button 
              className="format-button"
              onClick={() => handleOpenModal(<PaperInterface3 onClose={handleCloseModal} />)}
            >
              Select Format
            </button>
          </div>
  
          {/* Format Option 2 */}
          <div className="format-card">
            <img 
              src={FormatTwo} 
              alt="Advanced Format" 
              className="format-image"
            />
            <h5 className="format-title">Word Document with Cells and Tables</h5>
            <button 
              className="format-button"
              onClick={() => handleOpenModal(<PaperInterface2 onClose={handleCloseModal} />)}
            >
              Select Format
            </button>
          </div>
        </div>
  
        {/* Modal */}
        <Modal
          open={openModal}
          onClose={handleCloseModal}
          aria-labelledby="paper-interface-modal"
        >
          <div className="modal-content">
            {modalContent}
          </div>
        </Modal>
      </div>
    );
  };
  

export default FormatChoser;