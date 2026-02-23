// src/components/pr/PRLoadMore.jsx

const PRLoadMore = ({ loading, handleShowMore }) => (
    <div className="text-center my-8">
        <button
            onClick={handleShowMore}
            disabled={loading}
            className={`
        px-6 py-2 rounded-full text-white text-sm
        ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-400 hover:bg-green-500"}
      `}
        >
            {loading ? "로딩 중..." : "더보기"}
        </button>
    </div>
);

export default PRLoadMore;
