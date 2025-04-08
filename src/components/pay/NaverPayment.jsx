import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NaverPayment = ({ product, user }) => {
    const [isSDKLoaded, setIsSDKLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const apiHost = import.meta.env.VITE_API_HOST;

    useEffect(() => {
        if (!document.getElementById('naverPaySDK')) {
            const script = document.createElement('script');
            script.id = 'naverPaySDK';
            script.src = 'https://nsp.pay.naver.com/sdk/js/naverpay.min.js';
            script.async = true;
            script.onload = () => {
                console.log("네이버페이 SDK 로드 완료");
                setIsSDKLoaded(true);
            };
            script.onerror = () => {
                console.error("네이버페이 SDK 로드 실패");
                setFeedbackMessage("네이버페이 SDK를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
            };
            document.body.appendChild(script);
        } else {
            setIsSDKLoaded(true);
        }
    }, []);

    const handleNaverPayment = async () => {
        // 제품 정보 검증
        if (!product || !product._id || !product.productPrice) {
            setFeedbackMessage("결제할 제품 정보가 올바르지 않습니다.");
            return;
        }
        if (!isSDKLoaded) {
            setFeedbackMessage("SDK가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.");
            return;
        }
        if (typeof window.Naver === 'undefined' || !window.Naver.Pay) {
            setFeedbackMessage("네이버페이 SDK가 올바르게 로드되지 않았습니다.");
            return;
        }

        setLoading(true);
        setFeedbackMessage("결제 예약 진행 중...");

        try {
            // 백엔드의 예약 API를 호출하여 주문번호(merchantPayKey)를 생성합니다.
            const reserveResponse = await axios.post(
                `${apiHost}/api/naver-pay/reserve`,
                {
                    productId: product._id,
                    amount: product.productPrice,
                },
                { withCredentials: true }
            );
            console.log("=== 주문 예약 응답 ===", reserveResponse.data);
            const { orderId } = reserveResponse.data;
            if (!orderId) {
                setFeedbackMessage("주문 예약에 실패했습니다. (주문번호 누락)");
                setLoading(false);
                return;
            }
            const merchantUserKey = user?.publicKey || "anonymous";

            // 네이버페이 SDK 객체 생성 (팝업 모드)
            const oPay = window.Naver.Pay.create({
                mode: import.meta.env.VITE_NAVER_PAY_MODE || "development",
                clientId: import.meta.env.VITE_NAVER_PAY_CLIENT_ID,
                chainId: import.meta.env.VITE_NAVER_PAY_CHAIN_ID,
                payType: "normal",
                openType: "popup",
                // onAuthorize 콜백에서 결제 승인 처리 진행
                onAuthorize: async (oData) => {
                    console.log("onAuthorize 응답 데이터: ", oData);
                    if (oData.resultCode === "Success") {
                        setFeedbackMessage("결제 승인 처리 중...");
                        try {
                            // 백엔드 승인 API 호출 (pg_token 없이 호출)
                            const approvalResponse = await axios.get(`${apiHost}/api/naver-pay/approve`, {
                                params: {
                                    merchantPayKey: orderId,
                                    resultCode: oData.resultCode,
                                    resultMessage: oData.resultMessage,
                                    paymentId: oData.paymentId,
                                },
                                withCredentials: true,
                            });
                            console.log("백엔드 결제 승인 응답:", approvalResponse.data);
                            if (approvalResponse.data.success) {
                                setFeedbackMessage("결제 승인 완료");
                                // 필요 시 후속 처리 (UI 업데이트, 페이지 이동 등)
                            } else {
                                setFeedbackMessage("결제 승인 실패: " + approvalResponse.data.error);
                            }
                        } catch (approvalError) {
                            console.error(
                                "결제 승인 처리 오류:",
                                approvalError.response ? approvalError.response.data : approvalError.message
                            );
                            setFeedbackMessage("결제 승인 처리 중 오류가 발생했습니다.");
                        }
                    } else {
                        setFeedbackMessage("결제 인증 실패: " + oData.resultMessage);
                    }
                    setLoading(false);
                },
                onCancel: () => {
                    setFeedbackMessage("결제가 취소되었습니다.");
                    setLoading(false);
                },
            });

            oPay.open({
                merchantPayKey: orderId,
                merchantUserKey: merchantUserKey,
                productName: product.productName,
                productCount: 1,
                totalPayAmount: product.productPrice,
                taxScopeAmount: product.productPrice,
                taxExScopeAmount: 0,
                // returnUrl은 onAuthorize 콜백으로 처리되므로 별도로 사용하지 않습니다.
                returnUrl: `${apiHost}/api/naver-pay/approve`,
                productItems: [
                    {
                        categoryType: "ETC",
                        categoryId: "ETC",
                        uid: product._id,
                        name: product.productName,
                        payReferrer: "ETC",
                        count: 1,
                    },
                ],
            });
        } catch (err) {
            console.error("=== 결제 준비 중 오류 ===", err);
            setFeedbackMessage("결제 준비 중 오류가 발생했습니다.");
            setLoading(false);
        }
    };

    return (
        <div className="naver-payment-container">
            {loading && <p>처리 중입니다... {feedbackMessage}</p>}
            {!loading && feedbackMessage && <p>{feedbackMessage}</p>}
            <button
                onClick={handleNaverPayment}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
                네이버 간편결제
            </button>
        </div>
    );
};

export default NaverPayment;
