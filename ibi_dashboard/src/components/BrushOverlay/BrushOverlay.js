import React, { useState, useEffect } from 'react';
import { Brush } from '@vx/brush';


const BrushOverlay = props => {
    const {
        xScale, yScale,
        width, height,
        margin,
        resizeTriggerAreas, 
        brushDirection, 
        initialBrushPosition,
        onBrushEnd,
        selectedBoxStyle, 
    } = props;

    const [ brushElement, setBrushElement ] = useState((<></>));
    useEffect(() => {
        setBrushElement((<></>));
        setBrushElement((
            <Brush
                xScale={xScale}
                yScale={yScale}
                width={width}
                height={height}
                margin={margin}
                resizeTriggerAreas={resizeTriggerAreas}
                brushDirection={brushDirection}
                initialBrushPosition={initialBrushPosition}
                onBrushEnd={onBrushEnd}
                selectedBoxStyle={selectedBoxStyle}
            />
        ));
    }, [ initialBrushPosition, xScale, yScale,
        width, height,
        margin,
        resizeTriggerAreas, 
        brushDirection, 
        onBrushEnd,
        selectedBoxStyle, ])

    return (
        <>{ brushElement }</>
    );
};

export default BrushOverlay;
