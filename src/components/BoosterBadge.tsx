
const BoosterBadge = () => {
    return (
        <div className="group/badge relative flex items-center justify-center">
            <div
                className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-help"
            >
                <svg width="100%" height="100%" viewBox="0 0 387 619" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 max-w-full max-h-full">
                    <path d="M184.793 588.897L26.3397 314.449C24.5534 311.355 24.5534 307.543 26.3397 304.449L184.793 30C188.642 23.3333 198.264 23.3333 202.113 30L360.566 304.449C362.353 307.543 362.353 311.355 360.566 314.449L202.113 588.897C198.264 595.564 188.642 595.564 184.793 588.897Z" stroke="#CF3EDB" strokeWidth="50" />
                    <path d="M193.453 465L103.453 309L193.453 153L283.453 309L193.453 465Z" fill="#CF3EDB" stroke="#CF3EDB" strokeWidth="5" />
                </svg>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-[#CF3EDB]/30 rounded-lg text-[10px] font-black uppercase tracking-wider text-[#CF3EDB] whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none z-[100] shadow-2xl">
                Server Booster
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-black" />
            </div>
        </div>
    );
};

export default BoosterBadge;
