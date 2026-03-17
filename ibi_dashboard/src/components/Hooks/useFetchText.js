import {useState, useEffect} from 'react';

const useFetchText = ({ url }) => {
    const [ currentUrl, setCurrentUrl ] = useState(url);
    const [ data, setData ] = useState({});
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(null);

    useEffect(() => {
        setCurrentUrl(url);
    }, [url]);

    useEffect(() => {
        if(currentUrl){
            setLoading(true);
            setError(null);
            fetch(currentUrl)
                .then(response => response.text())
                .then(d => setData(d))
                .catch(error => setError(error))
                .finally(() => setLoading(false));
        }
    }, [currentUrl]);
    
    return [ data, loading, error ];
}

export default useFetchText;