import React, { useState, useCallback } from 'react';
import IBIDashboard from '../IBIDashboard/IBIDashboard';
import { useWindowSize } from '../Hooks/useWindowSize';
import { useOnWindowResizeEnd } from '../Hooks/useOnWindowResizeEnd';

import './App.css';

const App = () => {
  const windowSize = useWindowSize();
  const [ smallScreen, setSmallScreen ] = useState(null);
  const [ compWidth, setCompWidth ] = useState(null);
  

  const onResizeEnd = useCallback(() => {
    if(windowSize.height && windowSize.width){
      setSmallScreen( windowSize.width < 800 );
      setCompWidth( windowSize.width * .98 );
    }
  }, [ windowSize, setSmallScreen, setCompWidth ]);

  useOnWindowResizeEnd(() => {
    onResizeEnd();
  });

  return (compWidth !== null && smallScreen !== null) 
    && (<IBIDashboard compWidth={compWidth} smallScreen={smallScreen} />);
}

export default App;