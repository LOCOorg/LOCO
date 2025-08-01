// src/components/DeveloperComponent/PhotoGallery.jsx

import React, {useEffect, useState} from "react";
import PropTypes from "prop-types";
import {getUserUploads} from "../../api/fileUploadAPI.js";  // 업로드 메타데이터(여기에 sourcePage 포함) 가져오는 API

export default function PhotoGallery({userId, className = ""}) {

// 모든 업로드(메타)와, 현재 선택된 필터, 필터링된 사진 리스트
    const [allUploads, setAllUploads] = useState([]);
    const [filterPage, setFilterPage] = useState("all");
    const [photos, setPhotos] = useState([]);


    useEffect(() => {

        if (!userId) return;
        // userId별 업로드 목록(id, url, sourcePage, …) 호출
        getUserUploads(userId)
            .then(data => {
                setAllUploads(data);
                setFilterPage("all");   // 초기엔 all
            })
            .catch(console.error);
    }, [userId]);

    // allUploads나 filterPage가 바뀔 때마다 photos 업데이트
    useEffect(() => {
        if (filterPage === "all") {
            setPhotos(allUploads);
        } else {
            setPhotos(allUploads.filter(p => p.sourcePage === filterPage));
        }
    }, [allUploads, filterPage]);

    // sourcePage 값들 추출 (중복 제거), all을 맨 앞에 추가
    const pageOptions = [
        "all",
        ...Array.from(new Set(allUploads.map(p => p.sourcePage).filter(Boolean)))
    ];

    return (
        <div className={`${className} space-y-4`}>
            {/* ── sourcePage 필터 버튼 ── */}
            <div className="flex flex-wrap gap-2">
                {pageOptions.map(page => (
                    <button
                        key={page}
                        onClick={() => setFilterPage(page)}
                        className={`px-3 py-1 rounded ${
                            filterPage === page
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-700"
                        }`}
                    >
                        {page === "all" ? "전체" : page}
                    </button>
                ))}
            </div>

            {/* ── 필터링된 사진 그리드 ── */}
            <div className="grid grid-cols-3 gap-2">
                {photos.map(p => (
                    <img
                        key={p._id}
                        src={p.url}
                        alt={p.filename}
                        className="object-cover rounded"
                    />
                ))}
            </div>
        </div>
    );
}

PhotoGallery.propTypes = {
    userId: PropTypes.string.isRequired,
    className: PropTypes.string,
};



















