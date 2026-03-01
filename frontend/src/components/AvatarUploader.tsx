import { useState, useRef, useEffect } from "react";

const AvatarUploader = ({ currentAvatar, onUpload, className = "", userName = "" }) => {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("File phải là ảnh (JPEG, PNG, GIF, WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File ảnh không được vượt quá 5MB");
      return;
    }

    setError("");
    
    // Tạo preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload ngay
    handleUpload(file);
  };

  const handleUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const result = await onUpload(formData);
      
      if (result.success) {
        // Clear preview sau khi upload thành công
        setPreview(null);
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setError(result.message || "Upload thất bại");
        setPreview(null);
      }
    } catch (err) {
      setError(err?.response?.data?.detail || "Có lỗi xảy ra khi upload");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Reset imageError when avatar changes
  useEffect(() => {
    setImageError(false);
  }, [currentAvatar, preview]);

  const getAvatarUrl = () => {
    if (preview) return preview;
    if (currentAvatar && currentAvatar.trim() !== "") return currentAvatar;
    return null;
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const avatarUrl = getAvatarUrl();
  const showImage = avatarUrl && !imageError;

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="relative inline-block w-full h-full">
        {/* Avatar Display */}
        <div
          onClick={handleClick}
          className="cursor-pointer relative group w-full h-full aspect-square"
        >
          {showImage ? (
            <img
              key={avatarUrl}
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover rounded-full border-2 border-gray-300 dark:border-gray-600 group-hover:border-blue-500 dark:group-hover:border-blue-400 transition-colors duration-300"
              onError={() => {
                setImageError(true);
              }}
            />
          ) : (
            <div className="w-full h-full rounded-full flex items-center justify-center text-white text-2xl font-bold bg-gradient-to-br from-blue-500 to-blue-600">
              {getInitials(userName)}
            </div>
          )}

          {/* Upload Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full flex items-center justify-center transition-all">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 text-xs px-2 py-1 rounded whitespace-nowrap transition-colors duration-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarUploader;

