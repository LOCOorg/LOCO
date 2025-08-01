// src/hooks/useChatRooms.js

import { useState, useEffect } from 'react';
import axios from 'axios';
const host = `${import.meta.env.VITE_API_HOST}/api/search`;
/**
 * 훅: 채팅방 목록 + 필터(친구/랜덤) + 참여자 검색 + 페이징
 *
 * @param {Object} options
 * @param {string} options.userId         - 조회할 사용자 ID (선택)
 * @param {'all'|'friend'|'random'} options.filterType - 채팅방 타입 필터
 * @param {string} options.searchTerm     - 참여자 검색어
 * @param {number} options.page           - 현재 페이지 (1부터 시작)
 * @param {number} options.size           - 페이지당 항목 수
 *
 * @returns {{
 *   rooms: Array,
 *   loading: boolean,
 *   error: any,
 *   pagination: {
 *     totalCount: number,
 *     size: number,
 *     prev: boolean,
 *     next: boolean,
 *     prevPage: number|null,
 *     nextPage: number|null,
 *     pageNumList: number[],
 *     current: number
 *   }
 * }}
 */
export default function useChatRooms({
                                         userId,
                                         filterType = 'all',
                                         searchTerm = '',
                                         page = 1,
                                         size = 20
                                     }) {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        totalCount: 0,
        size,
        prev: false,
        next: false,
        prevPage: null,
        nextPage: null,
        pageNumList: [],
        current: page
    });

    useEffect(() => {
        const fetchRooms = async () => {
            setLoading(true);
            setError(null);

            try {
                // 쿼리 파라미터 구성
                const params = {
                    userId,
                    page,
                    size,
                    ...(filterType !== 'all' && { type: filterType }),
                    ...(searchTerm && { keyword: searchTerm })
                };

                // API 호출
                const { data } = await axios.get(`${host}/chat-rooms-all`, { params });

                // 방 목록 세팅
                setRooms(data.docs || []);

                // 페이징 계산
                const totalPages = Math.ceil(data.totalCount / data.size) || 1;
                setPagination({
                    totalCount: data.totalCount,
                    size:       data.size,
                    prev:       data.page > 1,
                    next:       data.page < totalPages,
                    prevPage:   data.page > 1 ? data.page - 1 : null,
                    nextPage:   data.page < totalPages ? data.page + 1 : null,
                    pageNumList: Array.from({ length: totalPages }, (_, i) => i + 1),
                    current:    data.page
                });
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, [userId, filterType, searchTerm, page, size]);

    return { rooms, loading, error, pagination };
}
