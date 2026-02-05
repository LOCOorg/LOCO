// src/components/ui/myMenus.jsx
import {useState} from 'react';
import { useUserMinimal } from '../../hooks/queries/useUserQueries.js';
import useAuthStore from '../../stores/authStore.js';
import { FiUser } from 'react-icons/fi';

export default function MyMenus({
                                    src: overrideSrc,           // 우선 순위: 직접 전달된 URL
                                    profile: externalProfile,   // 프로필 오브젝트(._id, .photo[] 등)
                                    userId: externalUserId,     // 직접 전달된 유저 ID
                                    size = 12,                  // Tailwind 크기 (w-{size} h-{size})
                                    onClick,                    // 클릭 핸들러
                                    className = ''              // 추가 클래스
                                }) {
    const authUser = useAuthStore(state => state.user);
    const [imgError, setImgError] = useState(false);

    // fetch 할 사용자 ID 결정 (externalProfile → externalUserId → authUser)
    const targetUserId = externalProfile?._id || externalUserId || authUser?._id;

    // 🆕 React Query 캐싱 적용 (10분 캐싱)
    // overrideSrc가 있으면 API 호출 건너뛰기
    const { data: fetchedProfile } = useUserMinimal(targetUserId, {
        enabled: !!targetUserId && !overrideSrc
    });

    // 프로필 데이터 우선순위: externalProfile → fetchedProfile
    const profile = externalProfile || fetchedProfile;

    // 표시할 이미지 URL 결정
    const photoUrl =
        overrideSrc ||
        profile?.profilePhoto ||
        profile?.photo?.[0] ||
        null;

    const dimClasses = `w-${size} h-${size}`;
    const transformClasses = 'transform transition-transform duration-150 ease-out hover:scale-110';

    return (
        <>
            {photoUrl && !imgError ? (
                <img
                    src={photoUrl}
                    alt={profile?.username || 'avatar'}
                    onClick={onClick}
                    onError={() => setImgError(true)}  // 이미지 로드 실패 시 fallback
                    className={`${dimClasses} rounded-full object-cover cursor-pointer ${transformClasses} ${className}`}
                />
            ) : (
                // 사진이 없으면 User 아이콘으로 대체
                <div
                    onClick={onClick}
                    className={`flex items-center justify-center ${dimClasses} rounded-full bg-gray-300 cursor-pointer ${transformClasses} ${className}`}
                >
                    <FiUser size={size * 3.5} color="#2563eb" />
                </div>
            )}
        </>
    );

}
