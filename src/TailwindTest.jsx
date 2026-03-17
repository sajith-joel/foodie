const TailwindTest = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="md:flex">
          <div className="md:shrink-0 bg-gradient-to-r from-cyan-500 to-blue-500 p-8 flex items-center justify-center">
            <span className="text-white text-4xl">🎨</span>
          </div>
          <div className="p-8">
            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
              Tailwind CSS Test
            </div>
            <p className="block mt-1 text-lg leading-tight font-medium text-black">
              If you can see styled text with colors and spacing
            </p>
            <p className="mt-2 text-gray-500">
              Tailwind CSS is working correctly!
            </p>
            <div className="mt-4 flex space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailwindTest;