// src/hooks/search.js
import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * 범용 검색 + 페이징 훅
 * @param {string} endpoint       검색 API 엔드포인트 (예: '/api/search/users')
 * @param {object} initialParams  초기 params (searchType, chatUsers 등)
 * @param {number} pageSize       한 페이지 크기
 * @param {number} minKeywordLength  검색어 최소 길이 (이하일 때 요청 스킵)
 */
export function useSearch({
                              endpoint,
                              initialParams = {},
                              pageSize = 10,
                              minKeywordLength = 0
                          }) {
    const [data, setData]           = useState([]);
    const [pagination, setPageInfo] = useState(null);
    const [params, setParams]       = useState({ ...initialParams, page: 1, size: pageSize });
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState(null);

    // 현재 keyword 추출
    const { keyword = '' } = params;

    useEffect(() => {
        // 키워드가 설정되어 있고, 너무 짧으면 요청하지 않고 빈 상태로 유지
        if (keyword && keyword.length < minKeywordLength) {
            setData([]);
            setPageInfo(null);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(endpoint, { params });
                setData(res.data.dtoList || res.data.results);
                setPageInfo(res.data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [endpoint, JSON.stringify(params), minKeywordLength]);

    const setPage    = (page)       => setParams(p => ({ ...p, page }));
    const setKeyword = (k)          => setParams(p => ({ ...p, keyword: k, page: 1 }));
    const setType    = (t)          => setParams(p => ({ ...p, searchType: t, page: 1 }));
    const setParam   = (key, value) => setParams(p => ({ ...p, [key]: value, page: 1 }));

    return {
        data,
        pagination,
        loading,
        error,
        keyword,       // 추가: 현재 검색어
        setPage,
        setKeyword,
        setType,
        setParam
    };
}
