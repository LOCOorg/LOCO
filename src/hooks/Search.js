// src/hooks/Search.js - 일반화 버전
import { useState, useEffect } from 'react';
import axios from 'axios';

const search = (endpoint, query, page = 1, limit = 30) => {
    const [results, setResults] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            setError(null);
            try {
                // endpoint는 호출할 API 경로 (예: '/api/developer/users')
                const response = await axios.get(endpoint, {
                    params: { query, page, limit }
                });
                setResults(response.data.results);
                setTotal(response.data.total);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [endpoint, query, page, limit]);

    return { results, total, loading, error };
};

export default search;
