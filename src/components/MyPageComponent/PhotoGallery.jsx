//서브사진 클릭 메인사진 변경
//src/components/MyPageComponent/PhotoGallery.jsx
import useImageModal from '../../hooks/useImageModal.jsx';


const PhotoGallery = ({ photos = [], selectedIndex, onSelect }) => {
    const { openModal, ImageModal } = useImageModal();
    const mainPhotoUrl = photos[selectedIndex] || null;

    return (
        <div>
            {/* 메인 사진 */}
            <div className="w-full aspect-square mb-4 rounded-lg overflow-hidden bg-gray-200"
                 onClick={() => mainPhotoUrl && openModal(mainPhotoUrl)}>
                {mainPhotoUrl
                    ? <img src={mainPhotoUrl} alt="메인 사진" className="w-full h-full object-contain object-center" />
                    : <div className="flex items-center justify-center h-full text-gray-500">사진 없음</div>
                }
            </div>

            {/* 썸네일 */}
            <div className="flex gap-2 mb-4">
                {photos.slice(0, 7).map((url, i) => (
                    <div
                        key={i}
                        className={`w-12 h-12 rounded-md overflow-hidden cursor-pointer border-2 ${
                            i === selectedIndex ? 'border-blue-500' : 'border-transparent'
                        }`}
                        onClick={() => onSelect(i)}
                    >
                        <img src={url} alt={`서브 사진 ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                ))}
                {/* 사진이 없으면 빈 박스 */}
                {photos.length === 0 && Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-12 h-12 bg-gray-100 rounded-md" />
                ))}
            </div>
            <ImageModal />
        </div>
    );
};

export default PhotoGallery;
