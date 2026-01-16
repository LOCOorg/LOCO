import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-gray-100 text-gray-600 py-8 px-4 border-t border-gray-200">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-wrap justify-between items-start gap-8">
                    {/* 회사 정보 */}
                    <div className="text-sm space-y-2">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">LOCO</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
                            <p><span className="font-semibold text-gray-700">상호명:</span> (주)LOCO</p>
                            <p><span className="font-semibold text-gray-700">대표자명:</span> 홍길동</p>
                            <p><span className="font-semibold text-gray-700">사업자등록번호:</span> 000-00-00000</p>
                            <p><span className="font-semibold text-gray-700">통신판매업신고번호:</span> 제 2024-서울강남-0000 호</p>
                            <p className="lg:col-span-2"><span className="font-semibold text-gray-700">주소:</span> 서울특별시 강남구 테헤란로 123, LOCO 타워</p>
                            <p><span className="font-semibold text-gray-700">개인정보책임관리자:</span> 홍길동</p>
                            <p><span className="font-semibold text-gray-700">연락처:</span> 02-1234-5678</p>
                            <p><span className="font-semibold text-gray-700">이메일:</span> contact@loco.com</p>
                        </div>
                    </div>

                    {/* 링크 */}
                    <div className="flex space-x-6 text-sm font-semibold">
                        <Link to="/terms" className="hover:text-blue-600 transition-colors">이용약관</Link>
                        <span className="text-gray-300">|</span>
                        <Link to="/privacy" className="hover:text-blue-600 transition-colors">개인정보처리방침</Link>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-center">
                    <p>© 2026 LOCO. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
