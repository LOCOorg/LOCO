
function LoadingComponent() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                <h2 className="text-xl font-semibold mb-4">Loading</h2>
                <p className="mb-6">Loading</p>
            </div>
        </div>
    );
}

export default LoadingComponent;