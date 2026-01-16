import { useQuery } from '@tanstack/react-query';
import { getActiveTerms } from '../../api/termAPI';
import LoadingSpinner from '../common/LoadingSpinner';

const TermsViewer = ({ type }) => {
    const { data: terms, isLoading } = useQuery({
        queryKey: ['activeTerms'],
        queryFn: getActiveTerms,
    });

    if (isLoading) return <LoadingSpinner />;

    const term = terms?.data?.find(t => t.type === type);

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-8">
                {type === 'TERMS' ? '이용약관' : '개인정보처리방침'}
            </h1>
            <div className="bg-white p-8 border border-gray-200 rounded-lg shadow-sm min-h-[500px]">
                {term ? (
                    <div 
                        className="prose prose-blue max-w-none"
                        dangerouslySetInnerHTML={{ __html: term.content }} 
                    />
                ) : (
                    <p className="text-gray-500 text-center py-20">등록된 내용이 없습니다.</p>
                )}
            </div>
        </div>
    );
};

export default TermsViewer;
