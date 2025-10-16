const PostBody = ({ community, API_HOST }) => {
    if (!community) return null;

    return (
        <div className="prose max-w-none mb-8">
            {/* 게시글 이미지 */}
            {community.communityImages?.length > 0 && (
                <div className="flex flex-wrap gap-2 my-4">
                    {community.communityImages.map((src) => (
                        <img
                            key={src}
                            src={`${API_HOST}/uploads${src}`}
                            alt="본문 이미지"
                            className="max-h-96 w-auto rounded object-contain"
                        />
                    ))}
                </div>
            )}

            {/* 게시글 내용 */}
            <p className="text-gray-800" id={`post-${community._id}`}>
                {community.communityContents}
            </p>
        </div>
    );
};

export default PostBody;
