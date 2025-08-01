// File: src/components/DeveloperComponent/UserFriendList.jsx
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { getFriendsPage } from "../../api/userAPI.js";

export default function UserFriendList({ userId, className = "" }) {
    const [friends, setFriends] = useState([]);
    const [total,   setTotal]   = useState(0);
    const [page,    setPage]    = useState(0);
    const PAGE_SIZE = 20;

    useEffect(() => {
        if (!userId) return;
        (async () => {
            try {
                const { total: tot, friends: list } =
                    await getFriendsPage(userId, 0, PAGE_SIZE);  // getFriendsPage API 호출 :contentReference[oaicite:0]{index=0}
                setFriends(list);
                setTotal(tot);
                setPage(0);
            } catch (e) {
                console.error("친구내역 로드 실패", e);
            }
        })();
    }, [userId]);

    const loadMore = async () => {
        const next = page + 1;
        try {
            const { friends: more } =
                await getFriendsPage(userId, next * PAGE_SIZE, PAGE_SIZE);
            setFriends(prev => [...prev, ...more]);
            setPage(next);
        } catch (e) {
            console.error("친구 더보기 실패", e);
        }
    };

    return (
        <div className={`${className} flex flex-col h-full`}>
            <h3 className="text-lg font-semibold mb-2">
                친구 내역 ({total})
            </h3>
            <ul className="flex-1 overflow-auto divide-y divide-gray-200">
                {friends.map(f => (
                    <li key={f._id} className="py-2">
                        {f.nickname || f.name}
                    </li>
                ))}
            </ul>
            {friends.length < total && (
                <button
                    onClick={loadMore}
                    className="mt-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                    더 보기
                </button>
            )}
        </div>
    );
}

UserFriendList.propTypes = {
    userId:    PropTypes.string.isRequired,
    className: PropTypes.string,
};
