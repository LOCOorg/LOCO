import { FiCamera, FiPlus } from 'react-icons/fi'

export default function LeftProfileCard({
                                            profilePhoto,
                                            handleProfileUpload,
                                            albumImages = [],
                                            onAddToAlbum,
                                            onRemovePhoto,
                                            removeProfileImage,
                                        }) {

    const album = albumImages.slice(1);


    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            {/* 타이틀 */}

            {/* 프로필 섹션 */}
            <div className="flex flex-col items-center space-y-4">
                <h2 className="text-lg font-bold pl-2">프로필</h2>
                <div className="relative w-40 h-40 rounded-lg overflow-hidden bg-gray-100">
                    {profilePhoto ? (
                    <>
                        <img
                            src={profilePhoto}
                            alt="프로필 사진"
                            className="object-cover w-full h-full"
                        />
                        <button
                            onClick={removeProfileImage}   // 인덱스 0을 전달
                            className="absolute top-1 right-1 bg-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow"
                            title="프로필 사진 삭제"
                        >
                            ×
                        </button>
                        </>
                    ): <div className="w-full h-full flex items-center justify-center text-gray-300">
                            No Image
                        </div>
                    }

                </div>
                <button
                    onClick={handleProfileUpload}
                    className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-full text-sm hover:bg-gray-50 transition"
                >
                    <FiCamera />
                    <span>프로필 사진 올리기</span>
                </button>
            </div>

            {/* 앨범 섹션 */}
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold pl-2">앨범</h2>
                    <span className="text-sm text-gray-500">({album.length}/6)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {album.map((url, idx) => (
                        <div key={idx} className="relative">
                            <img
                                src={url}
                                alt={`앨범 ${idx + 1}`}
                                className="w-full aspect-square object-cover rounded-lg"
                            />
                            <button
                                onClick={() => onRemovePhoto(idx + 1)}
                                className="absolute top-1 right-1 bg-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow"
                            >
                                ×
                            </button>
                        </div>
                    ))}

                    {/* 빈 슬롯 (6개까지) */}
                    {albumImages.length < 7 && (
                        <div
                            onClick={onAddToAlbum}
                            className="aspect-square rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-2xl text-gray-300 cursor-pointer hover:bg-gray-100 transition"
                        >
                            <FiPlus />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
