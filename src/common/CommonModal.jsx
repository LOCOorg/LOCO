
// eslint-disable-next-line react/prop-types
const CommonModal = ({ isOpen, onClose, title, children, onConfirm, showCancel = true }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[1500]">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-xl font-semibold mb-4 text-black">{title}</h2>
                <div className="mb-4 text-black">{children}</div>
                <div className="flex justify-end space-x-2">
                    {showCancel && (
                        <button
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            onClick={onClose}
                        >
                            취소
                        </button>
                    )}
                    <button
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={onConfirm}
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommonModal;

