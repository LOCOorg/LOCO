// components/communitycomponents/CreatePollModal.jsx
import { useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';

const CreatePollModal = ({ isOpen, onClose, onCreatePoll }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [duration, setDuration] = useState(24); // 24시간

    const addOption = () => {
        if (options.length < 4) { // 인스타그램처럼 최대 4개 옵션
            setOptions([...options, '']);
        }
    };

    const removeOption = (index) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const updateOption = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSubmit = () => {
        if (!question.trim() || options.some(opt => !opt.trim())) {
            return;
        }

        const pollData = {
            question: question.trim(),
            options: options.map(opt => ({ text: opt.trim(), votes: 0 })),
            expiresAt: new Date(Date.now() + duration * 60 * 60 * 1000) // duration시간 후
        };

        onCreatePoll(pollData);

        // 초기화
        setQuestion('');
        setOptions(['', '']);
        setDuration(24);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-bold mb-4">투표 만들기</h2>

                {/* 질문 입력 */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        질문
                    </label>
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="투표 질문을 입력하세요"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={100}
                    />
                </div>

                {/* 선택지 입력 */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        선택지
                    </label>
                    {options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                            <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(index, e.target.value)}
                                placeholder={`선택지 ${index + 1}`}
                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                maxLength={50}
                            />
                            {options.length > 2 && (
                                <button
                                    onClick={() => removeOption(index)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                                >
                                    <FaTrash size={14} />
                                </button>
                            )}
                        </div>
                    ))}

                    {options.length < 4 && (
                        <button
                            onClick={addOption}
                            className="flex items-center space-x-2 text-blue-500 hover:bg-blue-50 p-2 rounded"
                        >
                            <FaPlus size={12} />
                            <span>선택지 추가</span>
                        </button>
                    )}
                </div>

                {/* 버튼 */}
                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        생성
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePollModal;
