import {useState, useEffect} from 'react';

const useFetch = ({ url }) => {
    const [ currentUrl, setCurrentUrl ] = useState(url);
    const [ data, setData ] = useState({});
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(null);

    useEffect(() => {
        setCurrentUrl(url);
    }, [url]);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(currentUrl)
            .then(response => response.json())
            .then(d => setData(d))
            .catch(error => setError(error))
            .finally(() => setLoading(false));
    }, [currentUrl]);
    
    return [ data, loading, error ];
}

export default useFetch;