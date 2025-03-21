// src/pages/signupPage/SignupPage.jsx

import SignupForm from "../../components/authComponent/SignupForm.jsx";

/**
 * SignupPage 페이지 컴포넌트
 * - 전체 레이아웃을 제공하며, 실제 회원가입 폼은 SignupForm 컴포넌트에서 구현합니다.
 */
const SignupPage = () => {
    console.log('SignupPage 페이지 렌더링, 현재 URL:', window.location.href);   // 디버깅 로그
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <SignupForm />
        </div>
    );
};

export default SignupPage;
