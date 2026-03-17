import { useOnWindowSizeChange } from './useOnWindowSizeChange';
import { useTimer } from 'use-timer';
import { useEffect, useCallback } from 'react';

const DELAY = 2;

export const useOnWindowResizeEnd = callback => {
    const { time, start, reset, pause } = useTimer({ interval: 240 });
    const onResize = useCallback(() => {
        reset();
        start();
    }, [ reset, start ]);

    useOnWindowSizeChange(onResize);

    useEffect(() => {
        if(time >= DELAY){
            reset();
            pause();
            callback();            
        }
    }, [ time, callback, reset, pause ]);
}