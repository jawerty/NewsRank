import React from 'react';
import { render } from 'react-dom';
import App from './components/App.jsx';

import styles from './css/style.css';
import summernote_styles from './css/summernote.css';

render(
  <App 
  	topics={window.topics || null}
  	topic={window.topic || null}
  	pubPanelData={window.pubPanel || null} />,
  document.getElementById('root')
);