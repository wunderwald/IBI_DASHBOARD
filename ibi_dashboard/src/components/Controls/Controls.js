import React, { useContext } from 'react';
import UIBox from '../UIBox/UIBox';
import Button from 'react-bootstrap/Button';
import NumericInput from '../NumericInput/NumericInput';
import { DashboardContext } from '../IBIDashboard/IBIDashboard';

const Controls = props => {
    const { minWidth, maxWidth, fullWidth, smallScreen } = props;

    //read context
    const {
        selectedLocalFileName,
        selectedTool, setSelectedTool,
        invertSignal, setInvertSignal,
        downloadData,
        samplingRate, setSamplingRate,
        uploadData,
    } = useContext(DashboardContext);

    //callbacks
    const doDownload = () => downloadData();

    const getToolButtonVariant = (toolId) => {
        const selectedVariant = "light";
        const unselectedVariant = "outline-light";
        return toolId === selectedTool ? selectedVariant : unselectedVariant;
    };

    const doSetSamplingRate = value => {
        setSamplingRate(value);
    };

    return (
            <UIBox title={null} minWidth={minWidth} maxWidth={maxWidth} fullWidth={fullWidth} smallScreen={smallScreen}>
                <div className="row">
                    <div className="col-5">
                        <h5>Data</h5>

                        <span>
                            <Button variant="outline-light" onClick={ uploadData }>Import file</Button>
                                [ Selected: <b>{ selectedLocalFileName || "None" }</b> ]
                        </span><br />
                        <span>
                            Set sampling rate: <NumericInput initValue={samplingRate} onConfirm={doSetSamplingRate} />
                        </span><br />
                        <Button variant="outline-light" onClick={doDownload}>Export file</Button>
                        <br />
                    </div>
                    
                    <div className="col-4">
                        <h5>Select Tool</h5>
                        <span>
                            <Button 
                                variant={getToolButtonVariant("addPeak")}
                                onClick={() => setSelectedTool("addPeak")}
                            >
                                Add peak
                            </Button>
                            <Button 
                                variant={getToolButtonVariant("removePeaks")}
                                onClick={() => setSelectedTool("removePeaks")}
                            >
                                Remove peaks
                            </Button>
                        </span><br />
                        <span>
                            <Button 
                                variant={getToolButtonVariant("setStartMarker")}
                                onClick={() => setSelectedTool("setStartMarker")}
                            >
                                Set start marker
                            </Button>
                            <Button 
                                variant={getToolButtonVariant("setEndMarker")}
                                onClick={() => setSelectedTool("setEndMarker")}
                            >
                                Set end marker
                            </Button>
                        </span><br />
                        <span>
                            <Button 
                                variant={getToolButtonVariant("addRegion")}
                                onClick={() => setSelectedTool("addRegion")}
                            >
                                Include region
                            </Button>
                            <Button 
                                variant={getToolButtonVariant("removeRegion")}
                                onClick={() => setSelectedTool("removeRegion")}
                            >
                                Exclude region
                            </Button>
                        </span><br />
                        <span>
                            <Button 
                                variant="outline-light"
                                onClick={() => setInvertSignal(!invertSignal)}
                            >
                                Invert signal
                            </Button>
                        </span>
                        <span>
                            <Button 
                                variant={getToolButtonVariant("none")}
                                onClick={() => setSelectedTool("none")}
                            >
                                None
                            </Button>
                        </span><br />
                    </div>

                    

                    <div className="col-3">
                        <h5>Usage</h5>
                        <p>
                            {
                                selectedTool === "none" && "Select a tool to interact with the data."
                            }
                            {
                                selectedTool === "addPeak" && "Draw a rectangle around the peak. The largest value in the rectangle will be added to the set of peaks."
                            }
                            {
                                selectedTool === "removePeaks" && "Draw a rectangle around one or more peaks. All peaks inside the rectangle will be removed."
                            }
                            {
                                selectedTool === "setStartMarker" && "Set the start marker by clicking any position in the ecg plot."
                            }
                            {
                                selectedTool === "setEndMarker" && "Set the end marker by clicking any position in the ecg plot."
                            }
                            {
                                selectedTool === "removeRegion" && "Draw a rectangle to exclude the data inside of it. This can be used to cut artifacts from the recording."
                            }
                            {
                                selectedTool === "addRegion" && "Click an excluded region to re-include it."
                            }
                        </p>
                    </div>
                </div>
                

            </UIBox>
    );
}
export default Controls;



