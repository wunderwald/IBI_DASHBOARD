import React, { useState, useContext, useEffect } from 'react';
import UIBox from '../../UIBox/UIBox';
import Dropdown from '../../Dropdown/Dropdown';
import Separator from '../../Separator/Separator';
import Button from 'react-bootstrap/Button';
import AlertDismissable from '../../Alert/AlertDismissable';
import { TrialTitleContext, SubjectTitleContext  } from '../../Dashboard/IBxxAdiDashboard/IBxxAdiDashboard';

const LOCAL_STORAGE_KEY = "ibxx_adi_validation";

const recordingQualityOptions = [
    {id: 'unset', title: '[select]'},
    {id: 'usable', title: 'Usable'},
    {id: 'partlyUsable', title: 'Partly Usable'},
    {id: 'notUsable', title: 'Not Usable'},
];


const resetLocalStorage = () => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({}));
}
const initLocalStorage = () => {
    if(!window.localStorage.getItem(LOCAL_STORAGE_KEY)){
        resetLocalStorage();
    }
}
const parseLocalStorage = () => {
    const localStorageDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
    const localStorageData = JSON.parse(localStorageDataString);
    return localStorageData;
}
const updateLocalStorage = (keys, data) => {
    const { userId, subjectTitle, trialTitle } = keys;
    const { quality, notes } = data;
    
    //read old local storage state
    const localStorageData = parseLocalStorage();

    //update local storage state
    if(!localStorageData[userId]){
        localStorageData[userId] = {};
    }
    if(!localStorageData[userId][subjectTitle]){
        localStorageData[userId][subjectTitle] = {};
    }
    if(!localStorageData[userId][subjectTitle][trialTitle]){
        localStorageData[userId][subjectTitle][trialTitle] = {};
    }
    localStorageData[userId][subjectTitle][trialTitle] = { quality, notes };

    //write local storage data
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localStorageData));
}
const writeLocalStorage = (userId, subjectTitle, trialTitle, quality, notes) => {
    if(subjectTitle && subjectTitle !== "noSubjectSelected"){
        //write to local storage
        const keys = { userId, subjectTitle, trialTitle };
        const data = { quality, notes };
        updateLocalStorage(keys, data);
    }
};
const readLocalStorage = (userId, subjectTitle, trialTitle) => {
    const localStorageData = parseLocalStorage();
    if(localStorageData[userId] 
        && localStorageData[userId][subjectTitle] 
        && localStorageData[userId][subjectTitle][trialTitle]){
            return localStorageData[userId][subjectTitle][trialTitle];
        }  
    return null;
};
const printLocalStorage = () => console.log(JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY)));



const IBxxValidationForm = props => {
    const { minWidth, maxWidth, fullWidth, smallScreen } = props;

    //read context
    const { trialTitle } = useContext(TrialTitleContext);
    const { subjectTitle } = useContext(SubjectTitleContext);

    //init state
    const [selectedQualityOption, setSelectedQualityOption] = useState(recordingQualityOptions[0].id);
    const [notes, setNotes] = useState("");
    const [userId, setUserId] = useState("user0");
    const [userIdInput, setUserIdInput] = useState(userId);
    const [showAlert, setShowAlert] = useState(false);

    //init caches for keys
    const [lastUserId, setLastUserId] = useState(userId);
    const [lastTrialTitle, setLastTrialTitle] = useState(trialTitle);
    const [lastSubjectTitle, setLastsubjectTitle] = useState(subjectTitle);

    //init local storage (useEffect runs only once if second param == [])
    useEffect(initLocalStorage, []);

    //handlers
    const handleUserIdInput = e => {
        setUserIdInput(e.target.value);
    };
    const handleUserIdLeave = () => {
        setUserId(userIdInput);
    }
    const updateQualityOption = optionId => {
        setSelectedQualityOption(optionId);
    }
    const handleTextAreaChange = e => {
        const text = e.target.value;
        setNotes(text);
    }
    const handleDownloadButton = () => {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        const blob = new Blob([ data ], {type : 'application/json'});
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = "validationData.json";
        link.click();
        link.remove();
    }
    const handleResetButton = () => {
        setShowAlert(true);
    }
    const resetAlertOnConfirm = () => {
        resetLocalStorage();
        setShowAlert(false);
    };
    const resetAlertOnDecline = () => {
        setShowAlert(false);
    }

    

    //write current state to localstorage if subjectTitle or trial or userId changes
    //  and clear / re-init fields
    useEffect(() => {

        writeLocalStorage(lastUserId, lastSubjectTitle, lastTrialTitle, selectedQualityOption, notes);

        //read preexisting data from local storage (if possible)
        const localStorageData = readLocalStorage(userId, subjectTitle, trialTitle);
        if(localStorageData !== null){
            setNotes(localStorageData.notes);
            setSelectedQualityOption(localStorageData.quality);
        }
        //or clear validation form
        else{
            setSelectedQualityOption(recordingQualityOptions[0].id);
            setNotes("");
        }

        //update caches
        if(userId !== lastUserId) setLastUserId(userId);
        if(subjectTitle !== lastSubjectTitle) setLastsubjectTitle(subjectTitle);
        if(trialTitle !== lastTrialTitle) setLastTrialTitle(trialTitle);

    }, [ userId, subjectTitle, trialTitle ]);

    return (
        <UIBox title="Validation" minWidth={minWidth} maxWidth={maxWidth} fullWidth={fullWidth} smallScreen={smallScreen}>

            {showAlert && (
                <AlertDismissable 
                    onConfirm={resetAlertOnConfirm}
                    onDecline={resetAlertOnDecline}
                    heading={"Clear Local Storage"}
                    text={"Are you sure?"}
                    labelDecline={"No, keep the data"}
                    labelConfirm={"Yes, delete everything"}
                />
            )}

            <Separator />
            <h5>Set User ID</h5>
            Current ID: <i>{userId}</i>
            <br></br>
            Enter User ID: <input 
                type="text" placeholder="userId" 
                value={userIdInput} 
                onChange={handleUserIdInput} 
                onBlur={handleUserIdLeave}
            />
            
            <br></br>
            
            <Separator />
            <h5>General recording quality</h5>
            <span>This recording is 
                <Dropdown 
                    id="quality"
                    options={recordingQualityOptions}
                    callback={optionId => updateQualityOption(optionId)}
                    name={`dd_${subjectTitle}_${trialTitle}`}
                />
            </span>


            <Separator />
            <h5>Notes</h5>
            <textarea 
                value={notes}
                onChange={handleTextAreaChange}
            />


            <Separator />
            <h5>Export</h5>
            <span>
                <Button 
                    variant="outline-light" size="sm" onClick={handleDownloadButton}
                >
                    Download Validation Data
                </Button>
            </span>


            <Separator />
            <h5>Admin</h5>
            <span>
                <p>
                <Button 
                    variant="outline-light" size="sm" 
                    onClick={() => writeLocalStorage(userId, subjectTitle, trialTitle, selectedQualityOption, notes)}
                >
                    Save Validation Data
                </Button>
                <small>[data is automatically saved when switching trial, subject or user]</small>
                <br></br>
                </p>
                <Button 
                    variant="outline-light" size="sm" onClick={printLocalStorage}
                >
                    Log local storage to console
                </Button>
                <Button 
                    variant="outline-danger" size="sm" onClick={handleResetButton}
                >
                    Reset local storage
                </Button>
            </span>

            
            
        </UIBox>
    );
};

export default IBxxValidationForm;
