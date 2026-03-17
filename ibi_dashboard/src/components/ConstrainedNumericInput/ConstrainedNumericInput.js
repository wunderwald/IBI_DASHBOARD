import React, {useState, useEffect} from 'react';

const makePlaceholder = ({ minValue, maxValue }) => `range: [${minValue}, ${maxValue}]`;

const ConstrainedNumericInput = ({initValue, minValue, maxValue, callback}) => {

    const [value, setValue] = useState(initValue);
    const [placeholder, setPlaceholder] = useState(makePlaceholder({ minValue, maxValue }));


    const handleInputChange = e => {
        const input = e.target.value;
        setValue(input);
    };
    const handleInputConfirm = e => {
        const input = e.target.value;
        if(Number.isSafeInteger(+input) && +input >= minValue && +input <= maxValue){
            callback(value);
        }
        else{
            setValue(initValue);
            callback(initValue);
        }
    };

    useEffect(() => {
        setPlaceholder(makePlaceholder({ minValue, maxValue }));
    }, [ minValue, maxValue ]);

    return (
        <>
            <input 
                type="text" 
                placeholder={placeholder}
                value={value} 
                onChange={handleInputChange} 
                onBlur={handleInputConfirm}
            />
        </>
    )
};

export default ConstrainedNumericInput;
