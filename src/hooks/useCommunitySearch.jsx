// File: /src/hooks/useCommunitySearch.js
import { useState, useEffect } from "react";
import axios from "axios";

const useCommunitySearch = (query, page = 1, limit = 10, searchType = "제목+내용") => {
    const [results, setResults] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_HOST}/api/search/community`, {
                    params: { query, page, limit, searchType, keyword: query }
                });
                setResults(response.data.results || []);
                setTotal(response.data.total || 0);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        if(query.trim() !== ""){
            fetchResults();
        }
    }, [query, page, limit, searchType]);

    return { results, total, loading, error };
};

export default useCommunitySearch;
