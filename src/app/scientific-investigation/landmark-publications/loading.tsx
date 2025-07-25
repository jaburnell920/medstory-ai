export default function Loading() {
  return (
    <div className="flex min-h-screen text-black">
      {/* Sidebar Skeleton */}
      <aside className="w-72 bg-[#002F6C] text-white flex flex-col p-6">
        <div className="text-2xl font-bold mb-4">
          <span style={{ color: '#35b4fc' }}>MEDSTORY</span>
          <span style={{ color: '#ff914d' }}>AI</span>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-blue-300 rounded w-3/4"></div>
          <div className="h-4 bg-blue-300 rounded w-1/2"></div>
          <div className="h-4 bg-blue-300 rounded w-2/3"></div>
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 bg-[#ededed] p-12">
        <div className="flex items-center mb-10">
          <span className="text-4xl mr-4">🔬</span>
          <div>
            <div className="h-8 bg-gray-300 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-6 bg-gray-300 rounded w-48 animate-pulse"></div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-3/5">
            <div className="bg-white border border-gray-300 shadow-md rounded-lg p-6 space-y-4">
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}