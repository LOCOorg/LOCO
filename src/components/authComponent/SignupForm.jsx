import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { checkNickname } from "../../api/userAPI";

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

    useEffect(() => {
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (nicknameStatus.available !== true) {
            setErrorMessage("닉네임을 확인해주세요.");
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
                <div className="mb-4 text-red-500">{errorMessage}</div>
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