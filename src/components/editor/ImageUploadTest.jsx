import { useState } from 'react';
import { editorService } from '../../api/editorAPI';
import { toast } from 'react-toastify';

const ImageUploadTest = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);

    const testUpload = async (file) => {
        setIsUploading(true);
        setUploadResult(null);
        
        try {
            console.log('🧪 테스트 업로드 시작:', file);
            
            const result = await editorService.uploadEditorImage(file);
            
            console.log('🧪 업로드 결과:', result);
            setUploadResult(result);
            
            if (result && result.success) {
                toast.success('업로드 성공!');
            } else {
                toast.error('업로드 실패: ' + (result?.message || '알 수 없는 오류'));
            }
        } catch (error) {
            console.error('🧪 업로드 오류:', error);
            setUploadResult({ error: error.message });
            toast.error('오류 발생: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            testUpload(file);
        }
    };

    return (
        <div className="p-4 border border-gray-300 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">🧪 이미지 업로드 테스트</h3>
            
            <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                disabled={isUploading}
                className="mb-4"
            />
            
            {isUploading && (
                <div className="text-blue-600 mb-4">업로드 중...</div>
            )}
            
            {uploadResult && (
                <div className="bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">업로드 결과:</h4>
                    <pre className="text-sm overflow-auto">
                        {JSON.stringify(uploadResult, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default ImageUploadTest;