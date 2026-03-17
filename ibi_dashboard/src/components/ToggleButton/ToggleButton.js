import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const ToggleButton = props => {
    const { texts, toggle } = props;

    const [textIndex, setTextIndex] = useState(0);

    const doToggle = () => {
        toggle();
        setTextIndex(textIndex === 0 ? 1 : 0);
    }

    return(
        <Row>
            <Col className="col-12">
                <Button variant="outline-light" size="sm" onClick={doToggle}>{texts[textIndex]}</Button>
            </Col>
        </Row>
    );
}
export default ToggleButton;