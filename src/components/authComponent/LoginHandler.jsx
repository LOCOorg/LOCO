// src/components/authComponents/LoginHandler.jsx
import { useEffect } from "react";                        // React useEffect 훅 임포트
import { useNavigate, useSearchParams } from "react-router-dom"; // URL 쿼리 접근 및 페이지 이동 훅 임포트
// import axios from "axios";                                // HTTP 요청 라이브러리 임포트
import { loginWithKakao } from '../../api/authAPI.js';
import useAuthStore from "../../stores/authStore.js";
/**
 * LoginHandler 컴포넌트
 * - URL 쿼리에서 인가 코드를 추출하고, 백엔드의 /api/auth/kakao/callback API를 호출합니다.
 * - 응답에 따라, 회원가입이 필요한 경우 /signup으로, 로그인 성공인 경우 메인 페이지로 이동합니다.
 */
const LoginHandler = () => {                              // 함수 컴포넌트 선언 (수정)
    const navigate = useNavigate();                         // 페이지 이동 함수 생성 (수정)
    const [searchParams] = useSearchParams();              // URL 쿼리 파라미터 접근 (수정)
    const code = searchParams.get("code");                  // 인가코드 추출 (수정)

    // 인가 코드가 제대로 받아지는지 확인
    console.log("카카오 code:", code);

    // Zustand의 상태 업데이트 함수를 가져옴
    const setAccessToken = useAuthStore(s => s.setAccessToken);
    const setUser        = useAuthStore(s => s.setUser);


    useEffect(() => {
        if (!code) return;
        (async () => {
            try {
                const data = await loginWithKakao(code);
                if (data.status === 'noUser') {
                    navigate('/signupPage');
                } else if (data.status === 'success') {
                    setAccessToken(data.accessToken);
                    setUser(data.user);
                    navigate('/');
                }
            } catch (err) {
                console.error('카카오 로그인 처리 에러:', err);
            }
        })();
    }, [code, navigate, setAccessToken, setUser]);



//api호출하는거 따로 분리하기(숙제)
//     useEffect(() => {                                       // useEffect: 컴포넌트 마운트 시 실행 (수정)
//         if (code) {
//             axios
//                 .get(`http://localhost:3000/api/auth/kakao/callback?code=${code}`,{
//                     withCredentials: true,  // 세션 쿠키 전달을 위해 추가
//                 })     // 백엔드 OAuth 콜백 API 호출 (수정)
//                 .then((response) => {
//                     const data = response.data;
//                     if (data.status === "noUser") {                 // 회원가입 필요 응답인 경우
//                         // (수정) 세션에 저장된 카카오 정보를 사용하므로, 별도의 데이터 전달 없이 /signup으로 이동
//                         navigate(`/signupPage`);                         // 회원가입 페이지로 클라이언트 사이드 이동 (수정)
//                     } else if (data.status === "success") {          // 로그인 성공 응답인 경우
//                         // localStorage.setItem("token", data.token);     // JWT 토큰을 localStorage에 저장 (수정)
//                         // 로그인 성공 시 Zustand store 업데이트
//                         // setToken(data.token);
//                         setUser(data.user);
//                         navigate("/");                                 // 메인 페이지로 이동 (수정)
//                     }
//                 })
//                 .catch((error) => {                                // 오류 헨들링 시작 (수정)
//                     console.error("로그인 처리 에러:", error.response?.data || error.message); // 오류 로그 출력 (수정)
//                 });
//         }
//     }, [code, navigate, setToken, setUser]);

    return <div>로그인 처리 중...</div>;                    // 로딩 중 메시지 표시 (수정)
};

export default LoginHandler;                              // 컴포넌트 export (수정)
//ㅁㄴㅇㄹ