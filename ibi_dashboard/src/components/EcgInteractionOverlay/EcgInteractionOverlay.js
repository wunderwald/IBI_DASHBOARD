import React, { useState, useContext, useMemo, useCallback, useEffect } from 'react';
import { scaleLinear } from '@visx/scale';
import PatternOverlay from '../PatternOverlay/PatternOverlay';

import { DashboardContext } from '../IBIDashboard/IBIDashboard';

const EcgInteractionOverlay = props => {
    const {
        x0, x1, y0, y1, ecgData
    } = props;

    //parse context
    const {
        presentationIndexRange,
        indexRange, setIndexRange, maxIndex,
        disabledIndexRanges, setDisabledIndexRanges,
        peakData, setPeakData,
        ecgIsLoading, peaksAreLoading,
        invertSignal,
        selectedTool, 
    } = useContext(DashboardContext);

    //selection state
    const [ selectedRegion, setSelectedRegion ] = useState(null);
    const [ peakModOverlayDims, setPeakModOverlayDims ] = useState({ x: null, width: null });

    //scale that maps current presentationIndexRange to pixels
    const xScale = useMemo(() => scaleLinear({
        domain: presentationIndexRange,
        range: [ x0, x1 ],
    }), [ presentationIndexRange, x0, x1 ]);

    //scale that maps pixel to index
    const scalePixelToIndex = useCallback(pixel => xScale.invert(pixel), [ xScale ]);

    
    /* PEAK MODIFICATION */
    const addPeak = selection => {
        const peak = ecgData
            .reduce((peak, ecg, i) => {
                if(i < selection.min || i > selection.max){
                    return peak;
                }
                if((!invertSignal && ecg > peak.ecg) || (invertSignal && ecg < peak.ecg)){
                    return ({ index: i, ecg: ecg });
                }
                return peak;
            }, ({index: selection.min, ecg: ecgData[selection.min]}));
        const newPeaks = [...peakData, peak.index];
        setPeakData(newPeaks);
    }
    const removePeaks = selection => {
        setPeakData(peakData.filter(peakIndex => peakIndex < selection.min || peakIndex > selection.max));
    }
    const updatePeaks = () => {
        const selection = {
            min: Math.floor(scalePixelToIndex(peakModOverlayDims.x)),
            max: Math.floor(scalePixelToIndex(peakModOverlayDims.x + peakModOverlayDims.width))
        };
        selectedTool === "addPeak" && addPeak(selection);
        selectedTool === "removePeaks" && removePeaks(selection);
    }

    /* MARKERS */
    const getClickedIndex = event => {
        const boundingRectSvg = document.getElementById("svgEcgUi").getBoundingClientRect();
        const clickedXPixel = event.clientX - (boundingRectSvg.x);
        const clickedIndex = Math.floor(scalePixelToIndex(clickedXPixel));
        return clickedIndex;
    }
    const setStartMarker = event => {
        const clickedIndex = getClickedIndex(event);
        const newIndexRange = (clickedIndex > 0 && clickedIndex < indexRange[1]) 
            ? [ clickedIndex,  indexRange[1] ]
            : indexRange;
        setIndexRange(newIndexRange);
    };
    const setEndMarker = event => {
        const clickedIndex = getClickedIndex(event);
        const newIndexRange = (clickedIndex > indexRange[0]) 
            ? [ indexRange[0],  clickedIndex ]
            : indexRange;
        setIndexRange(newIndexRange);
    };


    /* DISABLED REGIONS */
    const updateDisabledRegions = useCallback(region => {
        if(!disabledIndexRanges || disabledIndexRanges.length === 0){
            setDisabledIndexRanges([ region ]);
            return;
        }
        if(!disabledIndexRanges.find(existingRegion => existingRegion.start === region.start)){
            const newRegions = [...disabledIndexRanges, region];
            setDisabledIndexRanges(newRegions);
            return;
        }
        let modifiedRegion = {};
        const newDisabledIndexRanges = disabledIndexRanges.map(existingRegion => 
            existingRegion.start !== region.start
                ? { ...existingRegion }    
                : (() => { 
                    modifiedRegion = existingRegion;
                    return { ...region }
                })()    
        );
        if(modifiedRegion.end !== region.end){
            //only update if end has changed
            setDisabledIndexRanges(newDisabledIndexRanges);
        }  
    }, [ disabledIndexRanges, setDisabledIndexRanges ]);

    const removeDisabledRegion = event => {
        const clickedIndex = getClickedIndex(event);
        // remove disabled region
        const newDisabledRegions = disabledIndexRanges.filter(existingRegion => {
            const range = existingRegion.start < existingRegion.end
                ? [ existingRegion.start, existingRegion.end ]
                : [ existingRegion.end, existingRegion.start ];
            return clickedIndex < range[0] || clickedIndex > range[1];
        });
        // remove start / end marker
        if(clickedIndex < indexRange[0]){
            setIndexRange([0, indexRange[1]]);
        }
        if(clickedIndex > indexRange[1]){
            setIndexRange([indexRange[0], maxIndex]);
        }
        setDisabledIndexRanges(newDisabledRegions);
    }


    /* PEAK MOD OVERLAY */
    const updatePeakModOverlay = useCallback(region => {
        const x = region.start < region.end
            ? xScale(region.start)
            : xScale(region.end);
        const width = region.start < region.end
            ? xScale(region.end) - xScale(region.start)
            : xScale(region.start) - xScale(region.end);
        //if no dims are set, set them
        if(peakModOverlayDims.x === null || peakModOverlayDims.width === null){
            setPeakModOverlayDims({ x, width });
            return;
        }
        //otherwise, only update if end has changed
        if(peakModOverlayDims.x !== x || peakModOverlayDims.width !== width){
            setPeakModOverlayDims({ x, width });
        }  
    }, [ peakModOverlayDims, setPeakModOverlayDims, xScale ]);
    
    const resetPeakModOverlay = () => {
        setPeakModOverlayDims({ x: null, width: null });
    }


    /* SELECTED REGION */
    const setSelectedRegionStart = event => {
        const clickedIndex = getClickedIndex(event);
        if(clickedIndex < 0){
            setSelectedRegion({ start: 0, end: 0 });
            return;
        }
        if(clickedIndex > maxIndex){
            setSelectedRegion({ start: maxIndex, end: maxIndex });
            return;
        }
        setSelectedRegion({ start: clickedIndex, end: clickedIndex });
    }
    const setSelectedRegionEnd = event => {
        const clickedIndex = getClickedIndex(event);
        const newIndex = clickedIndex < 0
            ? 0
            : clickedIndex > maxIndex
                ? maxIndex
                : clickedIndex;
        const newRegion = { start: selectedRegion.start, end: newIndex };
        setSelectedRegion(newRegion);
    }
    const resetSelectedRegion = () => setSelectedRegion(null);
    useEffect(() => {
        //update dashboard state if selected region changes
        if(!selectedRegion) return;
        switch(selectedTool){
            case "removeRegion":
                updateDisabledRegions(selectedRegion);
                return;
            case "addRegion":
                return;
            case "addPeak":
            case "removePeaks":
                updatePeakModOverlay(selectedRegion);
                return;
            default: return;
        }
    }, [selectedRegion, selectedTool, updateDisabledRegions, updatePeakModOverlay])


    /* RESET */
    const resetSelections = () => {
        resetSelectedRegion();
        resetPeakModOverlay();
    }
    

    /* HANDLERS */
    const handleClick = event => {
        switch(selectedTool){
            case "setStartMarker":
                setStartMarker(event);
                return;
            case "setEndMarker":
                setEndMarker(event);
                return;
            case "addRegion":
                removeDisabledRegion(event);
                return;
            default: return;
        }
    }
    
    const handleMouseDown = event => {
        switch(selectedTool){
            case "removeRegion":
                setSelectedRegionStart(event);
                return;
            case "addPeak":
                setSelectedRegionStart(event);
                return;
            case "removePeaks":
                setSelectedRegionStart(event);
                return;
            default: return;
        }
    }
    const handleMouseMove = event => {
        if(!selectedRegion) return;
        switch(selectedTool){
            case "removeRegion":
            case "addPeak":
            case "removePeaks":
                setSelectedRegionEnd(event);
                return;
            default: return;
        }
    }
    const handleMouseUp = () => {
        ["addPeak", "removePeaks"].includes(selectedTool) && updatePeaks();
        resetSelections();
    }    
    

    return (
        <>
            { /* Overlays for add / remove peaks */ }
            { selectedRegion && !(peaksAreLoading || ecgIsLoading) && 
                (<PatternOverlay
                    key={`peakModOverlay`}
                    patternId={"patternPeakModOverlay"} 
                    x={peakModOverlayDims.x}                        
                    y={y0}
                    width={peakModOverlayDims.width}
                    height={y1-y0}
                    edgeLeft={false}
                    edgeRight={false}
                    fill={ selectedTool === "addPeak" ? "#42694155": "#69424155" }
                    patternStroke="#000"
                    edgeStroke={ selectedTool === "addPeak" ? "#49634888" : "#63494888" }
                    noPattern={true}
                    hidden={!selectedRegion && [ "addPeak", "removePeaks" ].includes(selectedTool)}
                />)
            }

            { /* Interaction Overlay */ }
            <rect 
                x={x0}
                width={x1-x0}
                y={y0}
                height={y1-y0}
                fillOpacity={0}
                onClick={event => handleClick(event)}
                onMouseDown={event => handleMouseDown(event)}
                onMouseMove={event => handleMouseMove(event)}
                onMouseUp={event => handleMouseUp(event)}
            />
            
        </>
        
    );
};

export default EcgInteractionOverlay;
