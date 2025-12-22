const ReviewCard = ({ review }) => {
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${
          i < rating ? "text-yellow-400" : "text-gray-300"
        }`}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
          {review?.user?.avatar_url ? (
            <img
              src={review.user.avatar_url}
              alt={review?.user_name || review?.user?.username || "User"}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to initials if image fails
                e.target.style.display = "none";
                const parent = e.target.parentElement;
                const fallback = parent.querySelector(".avatar-fallback");
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}
          {/* Fallback: Initials */}
          <div
            className={`w-full h-full bg-blue-100 rounded-full flex items-center justify-center ${
              review?.user?.avatar_url ? "hidden avatar-fallback" : ""
            }`}
          >
            <span className="text-blue-600 font-semibold">
              {review?.user_name?.charAt(0)?.toUpperCase() ||
                review?.user?.username?.charAt(0)?.toUpperCase() ||
                "U"}
            </span>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-800">
              {review?.user_name || "Người dùng"}
            </h4>
            <div className="flex items-center">
              {renderStars(review?.rating || 5)}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">
            {review?.comment || "Không có đánh giá"}
          </p>
          
          <span className="text-xs text-gray-400">
            {review?.created_at 
              ? new Date(review.created_at).toLocaleDateString("vi-VN")
              : "Chưa có ngày"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;

