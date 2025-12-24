import { useNavigate } from "react-router-dom";

const HeroCard = ({
  title,
  subtitle,
  buttonText,
  backgroundColor,
  patternType = "radial",
  carImage,
  showEllipse = false,
  carConfig = {
    position: "right",
    size: "w-72",
    bottom: "bottom-2",
    offsetY: "translate-y-0",
  },
}) => {
  const navigate = useNavigate();

  const handleRentNow = () => {
    navigate("/category");
  };

  const backgroundStyle = {
    backgroundColor: backgroundColor,
    backgroundImage:
      patternType === "radial"
        ? `radial-gradient(circle at 0% 0%, rgba(255,255,255,0.15) 0%, transparent 60%)`
        : `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)`,
  };

  // Build car image classes from carConfig
  const carImageClasses = [
    "absolute",
    carConfig.position === "right" ? "right-6" : "left-6",
    carConfig.bottom || "bottom-2",
    carConfig.size || "w-72",
    carConfig.offsetY || "translate-y-0",
    "h-auto",
    "drop-shadow-2xl",
    "transition-transform duration-300",
    "group-hover:scale-105",
  ]
    .filter(Boolean)
    .join(" ");

  // Responsive car size classes
  const getResponsiveCarSize = () => {
    const baseSize = carConfig.size || "w-72";
    // Convert w-72 to responsive: smaller on mobile
    if (baseSize.includes("w-72")) {
      return "w-48 sm:w-56 md:w-64 lg:w-72";
    }
    if (baseSize.includes("w-73")) {
      return "w-48 sm:w-56 md:w-64 lg:w-73";
    }
    if (baseSize.includes("w-64")) {
      return "w-40 sm:w-48 md:w-56 lg:w-64";
    }
    return baseSize;
  };

  // Build car image classes from carConfig with responsive sizing
  const responsiveCarImageClasses = [
    "absolute",
    carConfig.position === "right" ? "right-2 sm:right-4 md:right-6" : "left-2 sm:left-4 md:left-6",
    carConfig.bottom || "bottom-2",
    getResponsiveCarSize(),
    carConfig.offsetY || "translate-y-0",
    "h-auto",
    "drop-shadow-2xl",
    "transition-transform duration-300",
    "group-hover:scale-105",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className="group relative overflow-hidden rounded-xl h-[200px] sm:h-[240px] md:h-[260px] transition-all duration-300 hover:shadow-xl hover:scale-[1.01]"
      style={backgroundStyle}
    >
      {/* ELLIPSE LAYER (TRANG TRÍ) */}
      {showEllipse && (
        <>
          {/* Ellipse lớn - góc trên bên trái */}
          <img
            src="/images/img_ellipse_41.png"
            alt="Ellipse decoration"
            className="absolute top-0 left-0 z-0 opacity-20 pointer-events-none w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 -translate-x-1/4 -translate-y-1/4"
          />
          {/* Ellipse nhỏ - phía dưới bên trái */}
          <img
            src="/images/img_ellipse_42.png"
            alt="Ellipse decoration"
            className="absolute bottom-0 left-0 z-0 opacity-15 pointer-events-none w-24 h-24 sm:w-36 sm:h-36 md:w-48 md:h-48 -translate-x-1/4 translate-y-1/4"
          />
        </>
      )}

      {/* TEXT LAYER */}
      <div className="relative z-10 p-4 sm:p-6 md:p-8 pb-16 sm:pb-20 md:pb-24 max-w-[70%] sm:max-w-[65%] md:max-w-[60%] h-full flex flex-col justify-between text-white">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 leading-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm md:text-base opacity-90 mb-4 sm:mb-6 leading-relaxed line-clamp-2 sm:line-clamp-none">
            {subtitle}
          </p>
        </div>
        <button
          onClick={handleRentNow}
          className="bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-lg w-fit text-blue-600 dark:text-blue-400 font-semibold text-xs sm:text-sm transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95"
        >
          {buttonText}
        </button>
      </div>

      {/* CAR IMAGE LAYER */}
      <img
        src={carImage || "/images/img_car.png"}
        alt="Car"
        className={responsiveCarImageClasses}
        onError={(e) => {
          e.target.src = "/images/img_car.png";
        }}
      />
    </section>
  );
};

export default HeroCard;

