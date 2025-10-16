import ProfileButton from '../MyPageComponent/ProfileButton.jsx';

const PostHeader = ({ community, postProfile, getDisplayNickname, formatRelativeTime }) => {
    if (!community) return null;

    return (
        <div className="border-b pb-4 mb-4">
            <h1 className="text-3xl font-bold mb-2">{community.communityTitle}</h1>
            <div className="text-sm text-gray-600 space-x-2 flex flex-wrap items-center">
                <span>
                    {!community.isAnonymous && postProfile && (
                        <ProfileButton
                            profile={postProfile}
                            area="프로필"
                        />
                    )}
                    작성자: <span className="font-semibold">{getDisplayNickname(community)}</span>
                </span>
                <span>카테고리: <span className="font-semibold">{community.communityCategory}</span></span>
                <span>작성일: <span className="font-medium">{formatRelativeTime(community.communityRegDate)}</span></span>
                <span>조회수: <span className="font-medium">{community.communityViews}</span></span>
                <span>추천: <span className="font-medium">{community.recommendedUsers?.length || 0}</span></span>
            </div>
        </div>
    );
};

export default PostHeader;
