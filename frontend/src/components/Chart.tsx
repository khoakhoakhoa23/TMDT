const Chart = ({ data, type = "bar" }) => {
  // Component cơ bản cho biểu đồ
  // Có thể tích hợp thư viện như Chart.js hoặc Recharts sau
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500 text-center">Không có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Biểu đồ thống kê</h3>
      
      {type === "bar" && (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-24 text-sm text-gray-600">{item.label}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div
                  className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` }}
                >
                  <span className="text-xs text-white font-semibold">
                    {item.value}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {type === "line" && (
        <div className="h-64 flex items-end justify-between space-x-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-600 rounded-t"
                style={{ height: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` }}
              />
              <div className="text-xs text-gray-600 mt-2">{item.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Chart;

