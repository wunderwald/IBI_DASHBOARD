import React, { useState, useEffect } from 'react';
import DropdownButton from 'react-bootstrap/DropdownButton';
import DropdownItem from 'react-bootstrap/DropdownItem';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import './Dropdown.css';


const Dropdown = props => {
    //name can be used to reset the dropdown
    const { options, callback, name } = props;

    const [activeIndex, setActiveIndex] = useState(0);
    const [opts, setOpts] = useState(options);

    
    const selectionHandler = index => {
        setActiveIndex(index);
        callback(options[index].id)
    }

    useEffect(() => {
        if(opts.length !== options.length){
            setOpts(options);
            setActiveIndex(0);
        }
    }, [ options, opts.length ]);

    //reset active index if name changes
    useEffect(() => {
        setActiveIndex(0);
    }, [ name ]);

    return (
        <DropdownButton
            as={ButtonGroup}
            variant='secondary'
            title={opts[activeIndex].title}
            onSelect={key => selectionHandler(key)}
        >
            {options.map((option, i) => {
                return(
                    <DropdownItem 
                        key={i} 
                        eventKey={i} 
                        active={+i === +activeIndex}
                        className={`dropdownItem ${option.visited ? 'visited' : ''}`} 
                    >
                            {option.title}
                    </DropdownItem>
                );
            })}
      </DropdownButton>
    );
};
export default Dropdown;
//title={options[activeIndex >= options.length ? 0 : activeIndex].title}