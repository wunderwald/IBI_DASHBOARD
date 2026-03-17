import './UIBox.css';

import React from 'react';

const UIBox = props => {
    const { title, minWidth, maxWidth, children, smallScreen, fullWidth } = props;

    return (
        <div className="visContainer uiBox" style={smallScreen ? {width: fullWidth} : {minWidth: minWidth, maxWidth: maxWidth}}> 
            {title && <h3>{title}</h3>}
            {children}
        </div>
    );
}
export default UIBox;