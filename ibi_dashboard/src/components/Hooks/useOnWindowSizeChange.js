import { useWindowSize } from './useWindowSize';
import { useEffect } from 'react';

export const useOnWindowSizeChange = callback => {
    const windowSize = useWindowSize();
    useEffect(() => callback(), [ windowSize, callback ]);
}