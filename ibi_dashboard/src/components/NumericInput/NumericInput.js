import React, { useState, useEffect } from 'react';

import './NumericInput.css';

const NumericInput = props => {
    const {
        initValue,
        onConfirm,
        minValue = null,
        maxValue = null
    } = props;
    const [currentValue, setCurrentValue] = useState("");

    const onInput = event => {
        const newValue = event.target.value;
        if(newValue === "") setCurrentValue("");
        if(minValue !== null && +newValue < minValue) return;
        if(maxValue !== null && +newValue > maxValue) return;
        setCurrentValue(newValue);
    }
    const valueToNumber = () => {
        if(currentValue === "") return initValue;
        return +currentValue;
    }
    const onBlur = () => onConfirm(valueToNumber());
    
    //reset if init value changes
    useEffect(() => setCurrentValue(initValue), [ initValue ]);

    return (
        <input type="number" className="NumericInput" placeholder={initValue} value={currentValue} onInput={onInput} onBlur={onBlur} />
    );
};

export default NumericInput;
