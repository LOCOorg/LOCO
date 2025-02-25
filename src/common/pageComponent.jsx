function PageComponent({ pageResponse, changePage }) {
  const {
    pageNumList,
    prev,
    next,
    prevPage,
    nextPage,
    current
  } = pageResponse;

  return (
      <div className="flex justify-center mt-4 sm:mt-auto">
        <nav aria-label="Table navigation">
          <ul className="flex items-center space-x-2">
            {prev && (
                <li>
                  <button
                      className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                      aria-label="Previous"
                      onClick={() => changePage(prevPage)}
                  >
                    <svg
                        className="w-4 h-4 fill-current"
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                    >
                      <path
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                          fillRule="evenodd"
                      ></path>
                    </svg>
                  </button>
                </li>
            )}

            {pageNumList.map((num) => (
                <li key={num}>
                  <button
                      className={`px-4 py-2 text-sm font-semibold rounded-lg 
                  ${current === num
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-green-500 border border-green-500 hover:bg-green-100'
                      }
                  focus:outline-none focus:ring-2 focus:ring-green-300 transition-all active:bg-green-600`}
                      onClick={() => changePage(num)}
                  >
                    {num}
                  </button>
                </li>
            ))}

            {next && (
                <li>
                  <button
                      className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                      aria-label="Next"
                      onClick={() => changePage(nextPage)}
                  >
                    <svg
                        className="w-4 h-4 fill-current"
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                    >
                      <path
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                          fillRule="evenodd"
                      ></path>
                    </svg>
                  </button>
                </li>
            )}
          </ul>
        </nav>
      </div>
  );
}

export default PageComponent;
