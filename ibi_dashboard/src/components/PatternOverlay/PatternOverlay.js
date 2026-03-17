import React from 'react';
import { PatternLines } from '@vx/pattern';

const PatternOverlay = props => {
    const { x, y, width, height, patternId, edgeRight, edgeLeft, patternStroke, fill, edgeStroke, hidden, noPattern=false } = props;
    return (
        !hidden && 
        <>
            <PatternLines 
                id={patternId} 
                height={21}
                width={21}
                stroke={patternStroke}
                strokeWidth={1}
                orientation={['diagonal']}
            />

            { edgeLeft && (
                <line
                    x1={x}
                    x2={x}
                    y1={y}
                    y2={y+height-1}
                    stroke={edgeStroke}
                    strokeWidth={1}
                />
            ) }

            <rect 
                fill={fill}
                fillOpacity={.96}
                x={x}
                y={y}
                width={width}
                height={height-1}
            />
            { !noPattern && <rect 
                fill={`url('#${patternId}')`}
                x={x}
                y={y}
                width={width}
                height={height-1}
            />}

            { edgeRight && (
                <line
                    x1={x + width}
                    x2={x + width}
                    y1={y}
                    y2={y+height-1}
                    stroke={edgeStroke}
                    strokeWidth={1}
                />
            ) }

        </>
    );
};

export default PatternOverlay;
