import { useState, useEffect, useCallback } from 'react';
import { getFriendsPage } from '../api/userAPI';
import useAuthStore from '../stores/authStore';

const PAGE_SIZE = 5;

export const usePaginatedFriends = ({ online }) => {
    const [friends, setFriends] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const authUser = useAuthStore((state) => state.user);

    const fetchFriends = useCallback(async (pageNum) => {
        if (!authUser?._id) return;

        setLoading(true);
        try {
            const offset = pageNum * PAGE_SIZE;
            const data = await getFriendsPage(authUser._id, offset, PAGE_SIZE, online);
            
            if (data.success) {
                setFriends(prev => pageNum === 0 ? data.friends : [...prev, ...data.friends]);
                setTotal(data.total);
                setHasMore((pageNum + 1) * PAGE_SIZE < data.total);
            }
        } catch (e) {
            console.error(`Failed to fetch friends (online: ${online})`, e);
        } finally {
            setLoading(false);
        }
    }, [authUser?._id, online]);

    useEffect(() => {
        // Initial fetch
        fetchFriends(0);
    }, [fetchFriends]);

    const loadMore = () => {
        if (hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchFriends(nextPage);
        }
    };
    
    const refresh = useCallback(() => {
        setPage(0);
        setFriends([]);
        fetchFriends(0);
    }, [fetchFriends]);

    return { friends, total, loading, hasMore, loadMore, refresh };
};