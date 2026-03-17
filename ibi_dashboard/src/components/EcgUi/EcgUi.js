import React, { useContext, useMemo, useCallback } from 'react';
import { scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@vx/axis';
import { Group } from '@vx/group';
import { padRange } from '../tools/padRange';
import { Text } from '@vx/text';
import LineChart from '../LineChart/LineChart';
import EcgInteractionOverlay from '../EcgInteractionOverlay/EcgInteractionOverlay';
import PatternOverlay from '../PatternOverlay/PatternOverlay';
import BrushOverlay from '../BrushOverlay/BrushOverlay';

import { DashboardContext } from '../IBIDashboard/IBIDashboard';

import './EcgUi.css';

// Downsample = 1: no downsampling; N: every Nth sample
const DOWNSAMPLE_CONTEXT = 20;


const EcgUi = props => {
    const { ecgData, width, height, smallScreen } = props;

    //parse context
    const {
        indexRange, disabledIndexRanges, peakData,
        presentationIndexRange, setPresentationIndexRange,
        peaksAreLoading, ecgIsLoading,
        invertSignal
    } = useContext(DashboardContext);

    //heights of subplots
    const heightRatioFocus = .75;
    const heightRatioMarginFocusContext = .1;
    const heightRatioContext = .15;

    //margins
    const marginLeft = smallScreen ? 40 : 60;
    const marginBottom = 40;
    const marginTop = 20;
    const marginRight = marginLeft / 2;

    // bounds
    const xMin = marginLeft;
    const xMax = width - marginRight;
    const yMin = marginTop;
    const yMax = height-marginBottom;

    
    const yMinFocus = yMin;
    const yMaxFocus = yMax * heightRatioFocus;
    const yMinContext = yMax * (heightRatioFocus + heightRatioMarginFocusContext);
    const yMaxContext = yMax;
    const xMinBrush = 0;
    const xMaxBrush = xMax-xMin;

    //parse data
    const yData = useMemo(() => {
        const ecg = ecgData || [];
        if(invertSignal){
            return ecg.map(sample => sample * -1);
        }
        return ecg;
    }, [ ecgData, invertSignal ]);
    const xData = useMemo(() => yData.map((y, i) => i), [ yData ]);

    //join & filter data
    const presentationFilter = useCallback(
        x => !presentationIndexRange || (x >= presentationIndexRange[0] && x <= presentationIndexRange[1]), 
        [presentationIndexRange]
    );
    
    const lineDataContext = useMemo(() =>
        xData
            .map((x, i) => ({ x, y: yData[i] }))
            .filter((x, i) => i%DOWNSAMPLE_CONTEXT === 0), 
        [ xData, yData ]
    );
    
    const lineDataFocus = useMemo(() => 
        xData
            .map((x, i) => ({ x, y: yData[i] }))
            .filter((coord) => presentationFilter(coord.x)),
        [ xData, yData, presentationFilter ]
    );


    //alternative for Math.min / Math.max => too large array size
    const getRange = arr => {
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        for(const value of arr){
            min = value < min ? value : min;
            max = value > max ? value : max;
        }
        return { min, max };
    };

    //calc ecg data ranges
    const rangesFocus = useMemo(() => ({
        x: getRange(lineDataFocus.map(l => l.x)),
        y: getRange(lineDataFocus.map(l => l.y))
    }), [ lineDataFocus ]);
    const rangesContext = useMemo(() => ({
        x: getRange(lineDataContext.map(l => l.x)),
        y: getRange(lineDataContext.map(l => l.y))
    }), [ lineDataContext ]);

    // make peak coords
    const makePeakCoords = useCallback((peakIndices, ecgData, ranges) => [...new Set(peakIndices)]
        .filter(peakIndex => peakIndex >= ranges.x.min && peakIndex <= ranges.x.max)
        .map(peakIndex => ({ x: peakIndex, y: ecgData[peakIndex] * (invertSignal ? -1 : 1) })),
        [ invertSignal ]
    );   
            

    //make scales
    const domainXFocus = useMemo(() => [rangesFocus.x.min, rangesFocus.x.max], [ rangesFocus ]);
    const domainXContext = useMemo(() => [rangesContext.x.min, rangesContext.x.max], [ rangesContext ]);
    const domainYFocus = padRange([rangesFocus.y.min, rangesFocus.y.max], .1);
    const domainYContext = padRange([rangesContext.y.min, rangesContext.y.max], .1);
    
    const xScaleFocus = useMemo(() => scaleLinear({
        domain: domainXFocus,
        range: [xMin, xMax],
    }), [ domainXFocus, xMin, xMax ]);
    
    const xScaleContext = useMemo(() => scaleLinear({
        domain: domainXContext,
        range: [xMin, xMax],
    }), [ domainXContext, xMin, xMax ]);

    const yScaleFocus = useMemo(() => scaleLinear({
        domain: domainYFocus,
        range: [yMaxFocus, yMinFocus],
    }), [ domainYFocus, yMaxFocus, yMinFocus ]);

    const yScaleContext = useMemo(() => scaleLinear({
        domain: domainYContext,
        range: [yMaxContext, yMinContext],
    }), [domainYContext, yMaxContext, yMinContext]);

    const xScaleBrush = useMemo(() => scaleLinear({
        domain: domainXContext,
        range: [xMinBrush, xMaxBrush],
    }), [domainXContext, xMinBrush, xMaxBrush]);

    //tick props
    const numTicksY = smallScreen ? 3 : 5;
    const tickLabelPropsX = () => ({
        fill: "#ced4da",
        fontFamily: 'sans-serif',
        textAnchor: 'middle',
        dx: '0em',
        dy: '.42em',
        fontSize: smallScreen ? '.8em' : '.9em',
    });
    const tickLabelPropsY = () => ({
        fill: "#ced4da",
        fontFamily: 'sans-serif',
        textAnchor: 'end',
        dx: '-0.4em',
        dy: '.42em',
        fontSize: smallScreen ? '.8em' : '.9em',
    });

    const selectedBrushStyle = useMemo(() => ({
        fill: "#ccc6",
        stroke: 'white',
    }), [ ]);


    const handleBrushEnd = useCallback((rect) => {
        if(!rect || !rect.x0 || !rect.x1) return;
        const {x0, x1} = rect;
        setPresentationIndexRange([
            x0 < 0 ? 0 : x0, 
            x1 > ecgData.length ? ecgData.length : x1
        ]);
    }, [ setPresentationIndexRange, ecgData ]);


    //svg elements
    const peaksSvg = useMemo(() => makePeakCoords(peakData, ecgData, rangesFocus).map(peak => {
        return (
            <circle 
                cx={xScaleFocus(peak.x)}
                cy={yScaleFocus(peak.y)}
                r={4}
                fill="#e67f83"
                key={`peak_${peak.x}`}
            />);
    }), [ peakData, ecgData, rangesFocus, xScaleFocus, yScaleFocus, makePeakCoords ]);

    const lineChartContextSvg = useMemo(() => (
        <LineChart 
            data={ lineDataContext }
            xScale={ xScaleContext }
            yScale={ yScaleContext }
            stroke="#fff"
        /> 
    ), [ lineDataContext, xScaleContext, yScaleContext ]);


    //return content
    return (
        <svg width={width} height={height} id="svgEcgUi" className="visContainer visSVG_saveable">
            <Group>
                { /* Focus View */ }
                <Group id="ecgUiFocus">
                    { (peaksAreLoading || ecgIsLoading) && (
                        <Text 
                            fill="#ccc"
                            fontSize="20px"
                            x={width / 2}
                            y={yMaxFocus / 2}
                            textAnchor="middle"
                        >Loading...</Text>
                    ) }
                    { (!(peaksAreLoading || ecgIsLoading) && (!ecgData || !peakData)) && (
                        <Text 
                            fill="#ccc"
                            fontSize="20px"
                            x={width / 2}
                            y={yMaxFocus / 2}
                            textAnchor="middle"
                        >Use the file picker to import a file.</Text>
                    ) }
                    <AxisBottom
                        scale={xScaleFocus}
                        left={0}
                        top={yMaxFocus}
                        stroke="#ced4da"
                        tickStroke="#ced4da"
                        tickLabelProps={tickLabelPropsX}
                    />
                    <AxisLeft
                        scale={yScaleFocus}
                        left={marginLeft}
                        numTicks={numTicksY}
                        stroke="#ced4da"
                        tickStroke="#ced4da"
                        tickLabelProps={tickLabelPropsY}
                    />
                    { !(peaksAreLoading || ecgIsLoading) && 
                        <LineChart 
                            data={lineDataFocus}
                            xScale={xScaleFocus}
                            yScale={yScaleFocus}
                            stroke="#fff"
                        /> 
                    }
                    { !(peaksAreLoading || ecgIsLoading) && 
                        <Group id="peaksGroup">
                            { peaksSvg }
                        </Group> 
                    }

                    { /* Overlays for disabled regions */ }
                    { !(peaksAreLoading || ecgIsLoading) && (indexRange && indexRange[0] > 0) &&
                        <PatternOverlay
                            patternId={"patternOverlayIndexRangeStart"} 
                            x={xMin}
                            y={yMinFocus}
                            width={indexRange 
                                ? (xScaleFocus(indexRange[0]) - xMin) < 0 
                                    ? 0 
                                    : (xScaleFocus(indexRange[0]) - xMin)
                                : 0
                            }
                            height={yMaxFocus - yMinFocus}
                            edgeLeft={false}
                            edgeRight={true}
                            fill="#333"
                            patternStroke="#444"
                            edgeStroke="#888"
                            hidden={false}
                        />
                    }
                    { (!(peaksAreLoading || ecgIsLoading) && (indexRange && indexRange[1] < domainXContext[1])) && 
                        <PatternOverlay
                            patternId={"patternOverlayIndexRangeEnd"} 
                            x={indexRange 
                                ? (xScaleFocus(indexRange[1]) < 0) ? 0 : xScaleFocus(indexRange[1])
                                : 0
                            }
                            y={yMinFocus}
                            width={indexRange 
                                ? (xMax - xScaleFocus(indexRange[1])) < 0 
                                    ? 0 
                                    : (xMax - xScaleFocus(indexRange[1]))
                                : 0
                            }
                            height={yMaxFocus - yMinFocus}
                            edgeLeft={true}
                            edgeRight={false}
                            fill="#333"
                            patternStroke="#444"
                            edgeStroke="#888"
                            hidden={false}
                        />
                    }
                    { !(peaksAreLoading || ecgIsLoading) && 
                        disabledIndexRanges.map((disabledRange, i) => {
                            const range = disabledRange.start < disabledRange.end
                                ? [ disabledRange.start, disabledRange.end ]
                                : [ disabledRange.end, disabledRange.start ];

                            return (
                                <PatternOverlay
                                    key={`disabledRange_start${disabledRange.start}`}
                                    patternId={`patternOverlayDisabledRange_${i}`} 
                                    x={xScaleFocus(range[0])}
                                    y={yMinFocus}
                                    width={xScaleFocus(range[1]) - xScaleFocus(range[0])}
                                    height={yMaxFocus - yMinFocus}
                                    edgeLeft={true}
                                    edgeRight={true}
                                    fill="#333"
                                    patternStroke="#444"
                                    edgeStroke="#888"
                                    hidden={false}
                                />
                            )
                        })
                    }
                    

                    { /* Interaction Overlay (must be last component) */}
                    { !(peaksAreLoading || ecgIsLoading) && 
                        <EcgInteractionOverlay 
                            x0={xMin}
                            x1={xMax}
                            y0={yMinFocus}
                            y1={yMaxFocus}
                            ecgData={ecgData}
                            maxIndex={domainXContext[1]}
                        />
                    }
                </Group>

                { /* Brushable Context View */ }
                <Group id="ecgUiContext">
                    { (peaksAreLoading || ecgIsLoading) && (
                        <Text 
                            fill="#ccc"
                            fontSize="16px"
                            x={width / 2}
                            y={yMinContext + (yMaxContext-yMinContext) / 2}
                            textAnchor="middle"
                        >Loading...</Text>
                    ) }
                    { !(peaksAreLoading || ecgIsLoading) && 
                        <>
                            <AxisBottom
                                scale={xScaleContext}
                                left={0}
                                top={yMaxContext}
                                stroke="#ced4da"
                                tickStroke="#ced4da"
                                tickLabelProps={tickLabelPropsX}
                            />
                            <AxisLeft
                                scale={yScaleContext}
                                left={marginLeft}
                                numTicks={0}
                                stroke="#ced4da"
                                tickStroke="#ced4da"
                                tickLabelProps={tickLabelPropsY}
                            />
                            { lineChartContextSvg }
                            <Group 
                                transform={`translate(${xMin}, ${yMinContext})`}
                            >
                                { presentationIndexRange && 
                                    (<BrushOverlay
                                        xScale={xScaleBrush}
                                        yScale={yScaleContext}
                                        width={xMax-marginLeft}
                                        height={yMax*heightRatioContext}
                                        margin={ {top: yMinContext, left: marginLeft, bottom: 0, right: marginRight} }
                                        resizeTriggerAreas={['left', 'right']}
                                        brushDirection="horizontal"
                                        initialBrushPosition={ {
                                            start: {x: xScaleBrush(presentationIndexRange[0])},
                                            end: {x: xScaleBrush(presentationIndexRange[1])}
                                        } }
                                        onBrushEnd={bounds => handleBrushEnd(bounds)}
                                        selectedBoxStyle={selectedBrushStyle}
                                    />) 
                                }
                            </Group>
                        </>
                    }

                </Group>



            </Group>
        </svg>
    );
};
export default EcgUi;


