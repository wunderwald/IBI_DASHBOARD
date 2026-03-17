import React, { useState, useEffect } from 'react';
import { useFilePicker } from 'use-file-picker';
import { download } from '../tools/download';

import EcgUi from '../EcgUi/EcgUi';
import Controls from '../Controls/Controls';

export const DashboardContext = React.createContext(null);

const tools = [
    "none",
    "setStartMarker",
    "setEndMarker",
    "addRegion",
    "removeRegion",
    "addPeak",
    "removePeaks"
];

const DEFAULT_SAMPLING_RATE = 1000;

const IBIDashboard = props => {
    //Read props
    const { compWidth, smallScreen } = props;

    //init state
    const [selectedLocalFileName, setSelectedLocalFileName] = useState(null);
    const [ecgData, setEcgData] = useState(null);
    const [peakData, setPeakData] = useState(null);
    const [samplingRate, setSamplingRate] = useState(DEFAULT_SAMPLING_RATE)
    const [indexRange, setIndexRange] = useState(null);
    const [disabledIndexRanges, setDisabledIndexRanges] = useState([]);
    const [presentationIndexRange, setPresentationIndexRange] = useState(null);
    const [ecgIsLoading, setEcgIsLoading] = useState(false);
    const [peaksAreLoading, setPeaksAreLoading] = useState(false);
    const [selectedTool, setSelectedTool] = useState("none");
    const [invertSignal, setInvertSignal] = useState(false);
    const [uploadedData, setUploadedData] = useState(null);


    //init index ranges (start/end marker values) if ecgData changes
    useEffect(() => {
        const uploadedDataHasIndexRange = (indexRange !== null && uploadedData !== null) 
            && uploadedData?.startIndex === indexRange[0] 
            && uploadedData?.endIndex === indexRange[1]; 
        if (ecgData) {
            const startIndex = uploadedDataHasIndexRange ? indexRange[0] : 0;
            const endIndex = uploadedDataHasIndexRange ? indexRange[1] : ecgData.length - 1;
            setIndexRange([startIndex, endIndex]);
            const newPresentationIndexRange = uploadedDataHasIndexRange 
                ? [startIndex, startIndex + Math.floor((endIndex-startIndex)/10)] 
                : [startIndex, Math.floor(endIndex / 10)]
            setPresentationIndexRange(newPresentationIndexRange);
        }
    }, [ecgData, uploadedData]);

    // reset disabled regions if ecg data changes
    useEffect(() => {
        const uploadedDataHasDisabledRanges = (disabledIndexRanges.length > 0 && uploadedData !== null)
            && uploadedData.removedRegions.every((region, i) => region.start === disabledIndexRanges[i].start && region.end === disabledIndexRanges[i].end);
        if (ecgData) {
            !uploadedDataHasDisabledRanges && setDisabledIndexRanges([]);
        }
    }, [ecgData, uploadedData]);

    //reset invert if ecg data changes
    useEffect(() => ecgData && setInvertSignal(false), [ecgData]);

    // test tool ids if selected tool changes
    useEffect(() => {
        if (!tools.includes(selectedTool)) {
            console.warn(`Invalid tool id: ${selectedTool}`);
            setSelectedTool(tools[0]);
        }
    }, [selectedTool])

    /* 
    FILE PICKER
    */
    const [openFileSelector, filePickerState] = useFilePicker({
        multiple: false,
        accept: ['.json'],
    });
    const uploadedDataIsValid = data => {
        console.warn("TODO: check uploaded files for existing keys etc. (cropped ecg/peaks/ibis are not necessary)");
        return true;
    }
    // react to file picker state changes (load data)
    useEffect(() => {
        const { filesContent, loading } = filePickerState;

        if(loading){
            setEcgIsLoading(true);
            setPeaksAreLoading(true);    
            return;
        }

        let data = null;
        try{
            data = JSON.parse(filesContent[0].content);
            setUploadedData(data);
        }catch{
            setEcgIsLoading(false);
            setPeaksAreLoading(false); 
            return;
        }

        const filename = filesContent[0].name;
        const dataIsValid = uploadedDataIsValid(data);
        if(dataIsValid){
            setSelectedLocalFileName(filename);
            setEcgData(data.ecg.map(sample => sample.ecg));
            setPeakData(data.peaks);
            setSamplingRate(data.samplingRate);
            setIndexRange([ data.startIndex, data.endIndex ]);
            setDisabledIndexRanges(data.removedRegions)
        }
        setEcgIsLoading(false);
        setPeaksAreLoading(false);
        filePickerState.clear();


    }, [filePickerState])
    
    const uploadData = () => {
        filePickerState.clear();
        openFileSelector();
    }

    /*
    DOWNLOAD DATA
    */
    const downloadData = () => {
        //0.1: cancel if no data is present
        if (!ecgData || !peakData) return;

        //0.2: cancel if there is no filename
        if (!selectedLocalFileName) return;

        //1.1: use index range and disabled regions to crop ecg
        const indexFilter = arr => (!indexRange || indexRange.length < 2)
            ? arr
            : (arr.filter((y, i) => (i >= indexRange[0] && i <= indexRange[1])
                && disabledIndexRanges.every(disabledRange => {
                    const range = disabledRange.start < disabledRange.end
                        ? [disabledRange.start, disabledRange.end]
                        : [disabledRange.end, disabledRange.start];
                    return !(i > range[0] && i < range[1]);
                })));

        const ecgDataWithIndex = ecgData.map((ecg, i) => ({ index: i, ecg: ecg }));
        const ecgCropped = indexFilter(ecgDataWithIndex)
            .map(sample => ({ index: sample.index, ecg: invertSignal ? sample.ecg * -1 : sample.ecg }));

        // 1.2: remove peak indices that are not in indexRange
        const peaksCropped = (!indexRange || indexRange.length < 2)
            ? peakData
            : peakData.filter(peakIndex =>
                (peakIndex >= indexRange[0] && peakIndex <= indexRange[1])
                && disabledIndexRanges.every(disabledRange => {
                    const range = disabledRange.start < disabledRange.end
                        ? [disabledRange.start, disabledRange.end]
                        : [disabledRange.end, disabledRange.start];
                    return !(peakIndex > range[0] && peakIndex < range[1]);
                })
            );

        peaksCropped.sort((a, b) => a - b);

        // 2: calculate ibis (for N disabled Regions, there are N+1 groups of peaks)
        const ibi = { samples: [], ms: [] };
        const numPeakGroups = disabledIndexRanges.length + 1;
        const samplesToMs = samples => samples / samplingRate * 1000;
        const peakGroups = peaksCropped
            .reduce((peakGroups, peakIndex) => {
                //if there are no disabled ranges, push all peaks to group zero
                if (disabledIndexRanges.length === 1 && disabledIndexRanges[0].length === 0) {
                    peakGroups[0].push(peakIndex);
                    return peakGroups;
                }
                for (let i = 0; i < disabledIndexRanges.length; ++i) {
                    const disabledRange = disabledIndexRanges[i];
                    const range = disabledRange.start < disabledRange.end
                        ? [disabledRange.start, disabledRange.end]
                        : [disabledRange.end, disabledRange.start];
                    if (peakIndex < range[0]) {
                        peakGroups[i].push(peakIndex);
                        return peakGroups;
                    }
                }
                peakGroups[numPeakGroups - 1].push(peakIndex);
                return peakGroups;
            }, [...Array(numPeakGroups)].map(i => []))

        peakGroups.forEach(peakGroup => {
            if (peakGroup.length < 2) return;
            for (let i = 1; i < peakGroup.length; ++i) {
                const ibiInSamples = peakGroup[i] - peakGroup[i - 1];
                const ibiInMs = samplesToMs(ibiInSamples);
                ibi.samples.push(ibiInSamples);
                ibi.ms.push(ibiInMs);
            }
        });

        //3: create & download json file:
        const output = {
            ecgCropped: ecgCropped,
            peaksCropped: peaksCropped,
            ecg: ecgDataWithIndex,
            peaks: peakData,
            ibi: ibi,
            samplingRate: samplingRate,
            removedRegions: disabledIndexRanges,
            startIndex: indexRange ? indexRange[0] : 0,
            endIndex: indexRange ? indexRange[1] : ecgData.length
        };
        download(selectedLocalFileName, JSON.stringify(output));
    }

    return (
        <div id="dashboard">
            <DashboardContext.Provider value={{
                selectedLocalFileName,
                indexRange, setIndexRange,
                disabledIndexRanges, setDisabledIndexRanges,
                presentationIndexRange, setPresentationIndexRange,
                peakData, setPeakData,
                peaksAreLoading, ecgIsLoading,
                selectedTool, setSelectedTool,
                samplingRate, setSamplingRate,
                invertSignal, setInvertSignal,
                downloadData, uploadData
            }}>
                <EcgUi ecgData={ecgData} width={compWidth} height={window.innerHeight * .6} smallScreen={smallScreen} />

                <Controls minWidth={compWidth} maxWidth={compWidth} fullWidth={compWidth} smallScreen={smallScreen} />
            </DashboardContext.Provider>

        </div>
    );
}
export default IBIDashboard;

