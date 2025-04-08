// src/hooks/useImageModal.jsx
import { useState } from 'react';

const useImageModal = () => {
    const [selectedImage, setSelectedImage] = useState(null);

    const openModal = (imageUrl) => {
        setSelectedImage(imageUrl);
    };

    const closeModal = () => {
        setSelectedImage(null);
    };

    const ImageModal = () => {
        if (!selectedImage) return null;
        return (
            <div
                onClick={closeModal}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}
            >
                <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                    <img
                        src={selectedImage}
                        alt="확대 보기"
                        style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px' }}
                    />
                    <button
                        onClick={closeModal}
                        style={{
                            position: 'absolute',
                            top: '1px',
                            right: '10px',
                            background: 'transparent',
                            border: 'none',
                            fontSize: '40px',
                            color: 'gray',
                            cursor: 'pointer',
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>
        );
    };

    return { openModal, closeModal, ImageModal, selectedImage };
};

export default useImageModal;
