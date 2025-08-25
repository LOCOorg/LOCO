// src/components/auth/SignupForm.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { checkNickname } from "../../api/userAPI";

const SignupForm = () => {
    const navigate = useNavigate();
    const [kakaoData, setKakaoData] = useState({});
    const [naverData, setNaverData] = useState({});
    const [info, setInfo] = useState("");
    const [nickname, setNickname] = useState("");
    const [email, setEmail] = useState("");
    // 회원가입 폼에서 입력한 성별
    const [formGender, setFormGender] = useState("");
    const [pass, setPass] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // 닉네임 중복 체크 관련 상태
    const [nicknameStatus, setNicknameStatus] = useState({
        available: null,
        message: "",
        loading: false
    });
    const [nicknameCheckTimeout, setNicknameCheckTimeout] = useState(null);

    useEffect(() => {
        axios
            .get("/api/auth/kakao-data", { withCredentials: true })
            .then((response) => {
                const data = response.data;
                // 생년월일 데이터가 있으면 YYYY-MM-DD 형식으로 변환
                if (data.birthyear && data.birthday) {
                    const computedBirthdate = `${data.birthyear}-${data.birthday.slice(0, 2)}-${data.birthday.slice(2)}`;
                    data.birthdate = computedBirthdate;
                }

                setKakaoData(data);
                console.log("세션에서 카카오 데이터 불러옴:", data);
            })
            .catch((error) => {
                console.error("카카오 데이터 불러오기 오류:", error.response?.data || error.message);
            });

        axios
            .get("/api/auth/naver-data", { withCredentials: true })
            .then((response) => {
                const data = response.data;
                if (data.birthyear && data.birthday) {
                    data.birthdate = `${data.birthyear}-${data.birthday}`;
                }
                setNaverData(data);
                console.log("세션에서 네이버 데이터 불러옴:", data);
            })
            .catch((error) => {
                console.error("네이버 데이터 불러오기 오류:", error.response?.data || error.message);
            });
    }, []);



    // 닉네임 중복 체크 함수
    const handleNicknameCheck = async (nicknameValue) => {
        if (!nicknameValue || nicknameValue.trim() === '') {
            setNicknameStatus({
                available: null,
                message: "",
                loading: false
            });
            return;
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
                message: "닉네임 확인 중 오류가 발생했습니다.",
                loading: false
            });
        }
    };

    // 닉네임 입력 핸들러 (디바운싱 적용)
    const handleNicknameChange = (e) => {
        const value = e.target.value;
        setNickname(value);

        // 기존 타이머 제거
        if (nicknameCheckTimeout) {
            clearTimeout(nicknameCheckTimeout);
        }

        // 0.5초 후 중복 체크 실행
        const newTimeout = setTimeout(() => {
            handleNicknameCheck(value);
        }, 500);

        setNicknameCheckTimeout(newTimeout);
    };


    const handleSubmit = async (e) => {

        e.preventDefault();

        // 닉네임 중복 체크 확인
        if (nicknameStatus.available !== true) {
            setErrorMessage("닉네임을 확인해주세요.");
            return;
        }

        try {
            // 폼에서 입력한 성별(formGender)와 카카오 데이터의 성별(kakaoData.gender)를 함께 전송
            const response = await axios.post(
                "/api/user/register",
                {
                    kakaoId: kakaoData.kakaoId,              // 카카오 데이터가 있으면 전송
                    naverId: naverData.naverId,              // 네이버 데이터가 있으면 전송
                    name: kakaoData.name || naverData.name || "",
                    // 전화번호: 카카오의 phoneNumber 우선, 없으면 네이버의 mobile (또는 phoneNumber) 사용
                    phoneNumber: kakaoData.phoneNumber || naverData.phoneNumber || "",
                    // 생년월일: 카카오에서 생성된 birthdate 또는 네이버에서 생성된 birthdate 사용
                    birthdate: kakaoData.birthdate || naverData.birthdate || "",
                    // 소셜 로그인 성별:
                    // 카카오의 경우 "male"/"female", 네이버의 경우 "M"/"F"이므로 그대로 전달하거나 변환할 수 있음
                    kakaoGender: (kakaoData.gender === "male" || kakaoData.gender === "female") ? kakaoData.gender : "",
                    naverGender: (naverData.gender === "M" || naverData.gender === "F") ? naverData.gender : "",
                    // 폼에서 직접 입력한 성별 (최종 사용자 선택)
                    formGender,
                    // 기타 생년월일 관련 정보 (원본 데이터)
                    birthday: kakaoData.birthday || naverData.birthday || "",
                    birthyear: kakaoData.birthyear || naverData.birthyear || "",
                    info,
                    nickname,
                    email,
                    pass,
                },
                { withCredentials: true }
            );
            console.log("회원가입 성공:", response.data);
            navigate("/");
        } catch (error) {
            console.error("회원가입 에러:", error.response?.data || error.message);
            setErrorMessage(
                error.response?.data?.message || "회원가입 중 오류가 발생했습니다."
            );
        }
    };


    // 닉네임 상태에 따른 스타일링 (기존 함수 교체)
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
                <div className="mb-4 text-red-500">{errorMessage}</div>
            )}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700">닉네임</label>
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className={getNicknameInputStyle()}
                        required
                        placeholder="2-12자로 입력해주세요"
                    />
                    {/* 닉네임 상태 메시지 */}
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
                {/* 회원가입 폼에서 입력한 성별 */}
                <div className="mb-4">
                    <label className="block text-gray-700">회원가입 폼 성별</label>
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
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700">PASS 인증</label>
                    <button
                        type="button"
                        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg"
                        onClick={() => alert("PASS 인증 처리 (예시)")}
                    >
                        PASS 인증
                    </button>
                </div>

                <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                    완료
                </button>
            </form>
        </div>
    );
};

export default SignupForm;
