import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';

const AlertDismissable = props => {
    const { onConfirm, onDecline, heading, text, labelDecline, labelConfirm } = props;

    return (
        
        <Alert show={true} variant="danger">
            <Alert.Heading>{heading}</Alert.Heading>
            <p>{text}</p>
            <hr />
            <div className="d-flex justify-content-end">
            <Button onClick={onDecline} variant="outline-success">
                {labelDecline}
            </Button>
            <Button onClick={onConfirm} variant="outline-danger">
                {labelConfirm}
            </Button>
            </div>
        </Alert>
        
    );
};

export default AlertDismissable;
