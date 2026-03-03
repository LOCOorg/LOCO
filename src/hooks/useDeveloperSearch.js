// src/hooks/useDeveloperSearch.js - 성능 모니터링이 추가된 최적화 버전
import { useState, useEffect, useCallback, useRef } from 'react';
import instance from '../api/axiosInstance.js';

/**
 * 개발자 페이지 전용 최적화된 검색 훅
 * - 복호화된 사용자 정보 조회
 * - 성능 모니터링
 * - 캐시 상태 추적
 * - 검색 최적화 상태 표시
 */
export function useDeveloperSearch({
    pageSize = 30,
    minKeywordLength = 0
}) {
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // 🔥 성능 추적 상태
    const [performanceMetrics, setPerformanceMetrics] = useState({
        searchTime: 0,
        cacheHitRate: 0,
        encryptionProcessed: 0,
        totalRequests: 0,
        averageResponseTime: 0
    });
    
    const requestStartTime = useRef(null);
    const searchHistory = useRef([]);

    // 🔥 성능 메트릭 계산
    const updatePerformanceMetrics = useCallback((responseData, searchDuration) => {
        const newRequest = {
            timestamp: Date.now(),
            duration: searchDuration,
            fromCache: responseData.fromCache || false,
            totalResults: responseData.total || 0,
            encryptionEnabled: responseData.encryption_enabled || false
        };

        searchHistory.current.push(newRequest);
        
        // 최근 10개 요청만 유지
        if (searchHistory.current.length > 10) {
            searchHistory.current = searchHistory.current.slice(-10);
        }

        const recentRequests = searchHistory.current;
        const cacheHits = recentRequests.filter(req => req.fromCache).length;
        const avgResponseTime = recentRequests.reduce((sum, req) => sum + req.duration, 0) / recentRequests.length;

        setPerformanceMetrics({
            searchTime: searchDuration,
            cacheHitRate: recentRequests.length > 0 ? (cacheHits / recentRequests.length) * 100 : 0,
            encryptionProcessed: responseData.performance?.decryption_count || 0,
            totalRequests: recentRequests.length,
            averageResponseTime: Math.round(avgResponseTime)
        });
    }, []);

    // 🔥 검색 수행 함수
    const performSearch = useCallback(async (searchKeyword, pageNum) => {
        // 키워드가 너무 짧으면 요청하지 않음
        if (searchKeyword && searchKeyword.length < minKeywordLength) {
            setData([]);
            setTotal(0);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);
        requestStartTime.current = Date.now();
        
        try {
            const params = {
                page: pageNum,
                limit: pageSize,
                ...(searchKeyword && { query: searchKeyword })
            };

            console.log('🔍 [최적화된 검색] 요청:', {
                keyword: searchKeyword || 'all',
                page: pageNum,
                limit: pageSize
            });
            
            const res = await instance.get('/api/developer/users', { params });
            const searchDuration = Date.now() - requestStartTime.current;
            
            console.log('✅ [최적화된 검색] 응답:', {
                total: res.data.total,
                results: res.data.results?.length || 0,
                fromCache: res.data.fromCache,
                searchType: res.data.search_type,
                encryptionEnabled: res.data.encryption_enabled,
                duration: `${searchDuration}ms`,
                cacheStatus: res.data.cacheStatus
            });

            // 🔥 성능 메트릭 업데이트
            updatePerformanceMetrics(res.data, searchDuration);

            // 🔥 결과에 성능 정보 태깅
            const resultsWithMetrics = (res.data.results || []).map(user => ({
                ...user,
                _fromCache: res.data.fromCache,
                _searchType: res.data.search_type,
                _searchDuration: searchDuration,
                _performance: res.data.performance
            }));

            // 페이지가 1이면 새로운 검색, 아니면 더보기
            if (pageNum === 1) {
                setData(resultsWithMetrics);
            } else {
                setData(prev => [...prev, ...resultsWithMetrics]);
            }
            
            setTotal(res.data.total || 0);
            
            // 🔥 검색 성공 로그
            if (res.data.fromCache) {
                console.log('⚡ [캐시 히트] 매우 빠른 응답!', {
                    cacheStatus: res.data.cacheStatus,
                    cachedAt: res.data.cachedAt
                });
            } else {
                console.log('📡 [서버 검색] 새로운 데이터 조회', {
                    searchType: res.data.search_type,
                    encryptionProcessed: res.data.performance?.decryption_count
                });
            }

        } catch (err) {
            console.error('❌ [검색 실패]:', {
                error: err.message,
                keyword: searchKeyword,
                page: pageNum,
                duration: Date.now() - requestStartTime.current
            });
            
            setError(err);
            
        } finally {
            setLoading(false);
        }
    }, [pageSize, minKeywordLength, updatePerformanceMetrics]);

    // 🔥 검색 실행 (디바운싱 포함)
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            performSearch(keyword, page);
        }, keyword ? 300 : 0); // 검색어가 있을 때만 디바운싱

        return () => clearTimeout(debounceTimer);
    }, [performSearch, keyword, page]);

    // 🔥 키워드 변경 핸들러
    const handleKeywordChange = useCallback((newKeyword) => {
        console.log('🔍 [키워드 변경]:', {
            from: keyword,
            to: newKeyword,
            length: newKeyword?.length || 0
        });
        
        setKeyword(newKeyword);
        setPage(1); // 새로운 검색 시 첫 페이지로
        setError(null); // 에러 초기화
    }, [keyword]);

    // 🔥 더보기 핸들러
    const loadMore = useCallback(() => {
        const nextPage = page + 1;
        console.log('📄 [더보기] 페이지 로딩:', {
            currentPage: page,
            nextPage: nextPage,
            currentResults: data.length,
            total: total
        });
        
        setPage(nextPage);
    }, [page, data.length, total]);

    // 🔥 검색 초기화
    const resetSearch = useCallback(() => {
        console.log('🔄 [검색 초기화]');
        setKeyword('');
        setPage(1);
        setData([]);
        setTotal(0);
        setError(null);
        searchHistory.current = [];
        setPerformanceMetrics({
            searchTime: 0,
            cacheHitRate: 0,
            encryptionProcessed: 0,
            totalRequests: 0,
            averageResponseTime: 0
        });
    }, []);

    // 🔥 검색 상태 정보
    const searchStatus = {
        isSearching: loading,
        hasResults: data.length > 0,
        hasError: !!error,
        isEmpty: !loading && data.length === 0 && !error,
        isFromCache: data.length > 0 && data[0]?._fromCache,
        searchType: data.length > 0 ? data[0]?._searchType : null,
        lastSearchDuration: performanceMetrics.searchTime
    };

    // 🔥 페이징 정보
    const pagination = {
        page,
        total,
        hasMore: data.length < total,
        progress: total > 0 ? Math.round((data.length / total) * 100) : 0
    };

    return {
        // 기본 데이터
        data,
        pagination,
        loading,
        error,
        keyword,
        
        // 핸들러들
        setKeyword: handleKeywordChange,
        setPage,
        loadMore,
        resetSearch,
        
        // 🔥 성능 및 상태 정보
        performanceMetrics,
        searchStatus,
        
        // 🔥 유틸리티
        refresh: () => performSearch(keyword, 1),
        
        // 🔥 디버깅 정보 (개발환경에서만)
        ...(process.env.NODE_ENV === 'development' && {
            _debug: {
                searchHistory: searchHistory.current,
                requestStartTime: requestStartTime.current,
                totalAPICallsThisSession: searchHistory.current.length
            }
        })
    };
}

/**
 * 캐시 상태 모니터링 훅
 */
export function useCacheStatus() {
    const [cacheStatus, setCacheStatus] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchCacheStatus = useCallback(async () => {
        setLoading(true);
        try {
            const res = await instance.get('/api/developer/cache-status');
            setCacheStatus(res.data);
            console.log('📊 [캐시 상태]:', res.data);
        } catch (error) {
            console.error('❌ [캐시 상태 조회 실패]:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCacheStatus(); // 최초 1회만 조회 (수동 refresh로 갱신)
    }, [fetchCacheStatus]);

    return {
        cacheStatus,
        loading,
        refresh: fetchCacheStatus
    };
}
