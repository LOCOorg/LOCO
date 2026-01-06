import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { checkNickname } from "../../api/userAPI";
import { getActiveTerms } from "../../api/termAPI"; // 약관 API 추가
import {validateNicknameClient} from "../../utils/nicknameValidator.js";
import CommonModal from "../../common/CommonModal";

const SignupForm = () => {
    const navigate = useNavigate();
    const [kakaoData, setKakaoData] = useState({});
    const [naverData, setNaverData] = useState({});
    const [info, setInfo] = useState("");
    const [nickname, setNickname] = useState("");
    const [email, setEmail] = useState("");
    const [formGender, setFormGender] = useState("");
    const [pass, setPass] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [deactivationCount, setDeactivationCount] = useState(0);

    const [nicknameStatus, setNicknameStatus] = useState({
        available: null,
        message: "",
        loading: false
    });
    const [nicknameCheckTimeout, setNicknameCheckTimeout] = useState(null);

    // 약관 동의 상태 (동적 관리)
    const [terms, setTerms] = useState([]); // 서버에서 불러온 약관 목록
    const [agreedTermIds, setAgreedTermIds] = useState([]); // 동의한 약관 ID 목록
    const [ageAgreed, setAgeAgreed] = useState(false); // 만 14세 이상 (별도 관리)
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalContent, setModalContent] = useState(null);

    useEffect(() => {
        // 약관 목록 불러오기
        getActiveTerms()
            .then(res => {
                if (res.success) {
                    setTerms(res.data);
                }
            })
            .catch(err => console.error("약관 불러오기 실패:", err));

        axiosInstance
            .get("/api/auth/kakao-data", { withCredentials: true })
            .then((response) => {
                const data = response.data.socialData;
                const count = response.data.deactivationCount;
                if (data.birthyear && data.birthday) {
                    const computedBirthdate = `${data.birthyear}-${data.birthday.slice(0, 2)}-${data.birthday.slice(2)}`;
                    data.birthdate = computedBirthdate;
                }

                setKakaoData(data);
                if (count > 0) setDeactivationCount(count);
                console.log("세션에서 카카오 데이터 불러옴:", data, "탈퇴횟수:", count);
            })
            .catch((error) => {
                console.error("카카오 데이터 불러오기 오류:", error.response?.data || error.message);
            });

        axiosInstance
            .get("/api/auth/naver-data", { withCredentials: true })
            .then((response) => {
                const data = response.data.socialData;
                const count = response.data.deactivationCount;
                if (data.birthyear && data.birthday) {
                    data.birthdate = `${data.birthyear}-${data.birthday}`;
                }
                setNaverData(data);
                if (count > 0) setDeactivationCount(count);
                console.log("세션에서 네이버 데이터 불러옴:", data, "탈퇴횟수:", count);
            })
            .catch((error) => {
                console.error("네이버 데이터 불러오기 오류:", error.response?.data || error.message);
            });
    }, []);

    const handleNicknameCheck = async (nicknameValue) => {
        // 1️⃣ 빈 값 체크

        if (!nicknameValue || nicknameValue.trim() === '') {
            setNicknameStatus({
                available: null,
                message: "",
                loading: false
            });
            return;
        }

        // ⭐⭐⭐ 2️⃣ 클라이언트 validation (새로 추가!)
        const clientValidation = validateNicknameClient(nicknameValue);

        if (!clientValidation.valid) {
            // ✅ 클라이언트에서 걸러짐 → API 호출 안 함!
            setNicknameStatus({
                available: false,
                message: clientValidation.message,
                loading: false
            });
            return;  // ⭐ 여기서 종료 (API 호출 생략)
        }

        setNicknameStatus(prev => ({ ...prev, loading: true }));

        try {
            const result = await checkNickname(nicknameValue);
            setNicknameStatus({
                available: result.available,
                message: result.message,
                loading: false
            });
        } catch (error) {
            setNicknameStatus({
                available: false,
                message: error.response?.data?.message || "닉네임 확인 중 오류가 발생했습니다.",
                loading: false
            });
        }
    };

    const handleNicknameChange = (e) => {
        const value = e.target.value;
        setNickname(value);

        if (nicknameCheckTimeout) {
            clearTimeout(nicknameCheckTimeout);
        }

        const newTimeout = setTimeout(() => {
            handleNicknameCheck(value);
        }, 500);

        setNicknameCheckTimeout(newTimeout);
    };

    // 전체 동의 핸들러
    const handleAllAgree = (e) => {
        const checked = e.target.checked;
        setAgeAgreed(checked);
        if (checked) {
            setAgreedTermIds(terms.map(t => t._id));
        } else {
            setAgreedTermIds([]);
        }
    };

    // 개별 약관 동의 핸들러
    const handleTermCheck = (termId) => {
        setAgreedTermIds(prev => 
            prev.includes(termId)
                ? prev.filter(id => id !== termId)
                : [...prev, termId]
        );
    };

    // 약관 모달 열기
    const openModal = (term) => {
        setIsModalOpen(true);
        const labels = {
            'TERMS': '서비스 이용약관',
            'PRIVACY': '개인정보 처리방침',
            'MARKETING': '마케팅 정보 수신'
        };
        setModalTitle(`${labels[term.type] || term.type} (v${term.version})`);
        setModalContent(
            <div className="text-sm text-gray-700 max-h-[60vh] overflow-y-auto p-2 border border-gray-100 rounded bg-gray-50">
                <div dangerouslySetInnerHTML={{ __html: term.content }} />
            </div>
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (nicknameStatus.available !== true) {
            setErrorMessage("닉네임을 확인해주세요.");
            return;
        }

        // 필수 약관 체크 확인
        const requiredTerms = terms.filter(t => t.isRequired);
        const isAllRequiredAgreed = requiredTerms.every(t => agreedTermIds.includes(t._id));

        if (!isAllRequiredAgreed || !ageAgreed) {
            setErrorMessage("모든 필수 약관 및 만 14세 이상 항목에 동의해주세요.");
            return;
        }

        const requestData = {
            kakaoId: kakaoData.kakaoId,
            naverId: naverData.naverId,
            name: kakaoData.name || naverData.name || "",
            phoneNumber: kakaoData.phoneNumber || naverData.phoneNumber || "",
            birthdate: kakaoData.birthdate || naverData.birthdate || "",
            kakaoGender: (kakaoData.gender === "male" || kakaoData.gender === "female") ? kakaoData.gender : "",
            naverGender: (naverData.gender === "M" || naverData.gender === "F") ? naverData.gender : "",
            formGender,
            birthday: kakaoData.birthday || naverData.birthday || "",
            birthyear: kakaoData.birthyear || naverData.birthyear || "",
            info,
            nickname,
            email,
            pass,
            deactivationCount,
            termIds: agreedTermIds, // 약관 동의 ID 목록 전송
        };
        
        try {
            const response = await axiosInstance.post(
                "/api/user/register",
                requestData,
                { withCredentials: true }
            );
            navigate("/");
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "회원가입 중 오류가 발생했습니다."
            );
        }
    };

    const getNicknameInputStyle = () => {
        let baseStyle = "w-full px-4 py-2 border rounded-lg ";
        if (nicknameStatus.loading) {
            return baseStyle + "border-gray-300";
        }
        if (nicknameStatus.available === true) {
            return baseStyle + "border-green-500 focus:border-green-600";
        }
        if (nicknameStatus.available === false) {
            return baseStyle + "border-red-500 focus:border-red-600";
        }
        return baseStyle + "border-gray-300";
    };

    const getNicknameMessageStyle = () => {
        if (nicknameStatus.available === true) {
            return "text-green-600 text-sm mt-1";
        }
        if (nicknameStatus.available === false) {
            return "text-red-600 text-sm mt-1";
        }
        return "text-gray-500 text-sm mt-1";
    };

    return (
        <div className="max-w-md w-full bg-white p-6 shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold mb-4 text-center">회원가입</h1>
            {errorMessage && (
                <div className="mb-4 text-red-500 text-sm font-medium">{errorMessage}</div>
            )}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700">닉네임</label>
                    <input
                        type="text"
                        value={nickname}
                        onChange={handleNicknameChange}
                        className={getNicknameInputStyle()}
                        required
                        placeholder="2-12자로 입력해주세요"
                    />
                    <div className={getNicknameMessageStyle()}>
                        {nicknameStatus.loading && "닉네임 확인 중..."}
                        {!nicknameStatus.loading && nicknameStatus.message}
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700">이메일</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">성별</label>
                    <select
                        value={formGender}
                        onChange={(e) => setFormGender(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                    >
                        <option value="">선택하세요</option>
                        <option value="male">남성</option>
                        <option value="female">여성</option>
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700">자기소개</label>
                    <textarea
                        value={info}
                        onChange={(e) => setInfo(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="자기소개를 입력해주세요 (선택)"
                    />
                </div>

                {/* 약관 동의 섹션 */}
                <div className="mb-6 border-t pt-4">
                    <div className="flex items-center mb-3">
                        <input
                            type="checkbox"
                            id="allAgree"
                            checked={ageAgreed && terms.length > 0 && terms.every(t => agreedTermIds.includes(t._id))}
                            onChange={handleAllAgree}
                            className="w-5 h-5 mr-2 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="allAgree" className="text-gray-900 font-bold cursor-pointer select-none">
                            전체 동의하기
                        </label>
                    </div>
                    
                    <div className="space-y-2 pl-1">
                        {/* 동적 약관 렌더링 */}
                        {terms.map((term) => (
                            <div key={term._id} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`term-${term._id}`}
                                        checked={agreedTermIds.includes(term._id)}
                                        onChange={() => handleTermCheck(term._id)}
                                        className="w-4 h-4 mr-2 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor={`term-${term._id}`} className="text-sm text-gray-700 cursor-pointer select-none">
                                        ({term.isRequired ? '필수' : '선택'}) {term.type === 'TERMS' ? '서비스 이용약관' : term.type === 'PRIVACY' ? '개인정보 수집 및 이용' : '마케팅 정보 수신'} 동의
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => openModal(term)}
                                    className="text-xs text-gray-500 underline hover:text-gray-700"
                                >
                                    내용보기
                                </button>
                            </div>
                        ))}

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="ageAgree"
                                checked={ageAgreed}
                                onChange={(e) => setAgeAgreed(e.target.checked)}
                                className="w-4 h-4 mr-2 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="ageAgree" className="text-sm text-gray-700 cursor-pointer select-none">
                                (필수) 만 14세 이상입니다
                            </label>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">본인 인증</label>
                    <button
                        type="button"
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                        onClick={() => alert("PASS 인증 처리 (구현 예정)")}
                    >
                        PASS 인증하기
                    </button>
                </div>

                <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                >
                    회원가입 완료
                </button>
            </form>

            <CommonModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalTitle}
                onConfirm={() => setIsModalOpen(false)}
                showCancel={false}
            >
                {modalContent}
            </CommonModal>
        </div>
    );
};

export default SignupForm;