import React from 'react';
import { LinePath } from '@vx/shape';
import { curveLinear } from '@vx/curve';


const LineChart = props => {
    const { data, xScale, yScale, stroke } = props;
    return (
        <>
            <LinePath 
                curve={curveLinear}
                data={data}
                x={d => xScale(d.x)}
                y={d => yScale(d.y)}
                stroke={stroke}
            />
        </>
    );
};

const prevEqualsNext = (prev, next) => {
    const strokeChanged = prev.stroke !== next.stroke;
    const scaleChanged = (scaleA, scaleB) => 
        scaleA.domain()[0] !== scaleB.domain()[0]
        || scaleA.domain()[1] !== scaleB.domain()[1]
        || scaleA.range()[0] !== scaleB.range()[0]
        || scaleA.range()[1] !== scaleB.range()[1];
    const xScaleChanged = scaleChanged(prev.xScale, next.xScale);
    const yScaleChanged = scaleChanged(prev.yScale, next.yScale);
    
    const dataLengthChanged = (prev.data.length !== next.data.length);
    const someDataItemsChanged = dataLengthChanged || (() => {
        for(let i=0; i<prev.data.length; i+=100){
            if(prev.data[i] !== next.data[i]){
                return true;
            }
        }
        return false;
    })();
    const dataChanged = dataLengthChanged || someDataItemsChanged;

    const changed = (strokeChanged || xScaleChanged || yScaleChanged || dataChanged);
    //true => don't rerender, false => rerender
    return !changed;
};

export default React.memo(LineChart, prevEqualsNext);
