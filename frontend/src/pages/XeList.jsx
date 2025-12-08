import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

export default function XeList() {
  const [list, setList] = useState([]);

  useEffect(() => {
    axiosClient.get("xe/")
      .then(res => setList(res.data))
      .catch(err => console.log(err));
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h2>Danh sách xe</h2>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Mã xe</th>
            <th>Tên xe</th>
            <th>Giá</th>
            <th>Số lượng</th>
            <th>Màu sắc</th>
            <th>Loại</th>
          </tr>
        </thead>
        <tbody>
          {list.map(x => (
            <tr key={x.ma_xe}>
              <td>{x.ma_xe}</td>
              <td>{x.ten_xe}</td>
              <td>{x.gia.toLocaleString()}</td>
              <td>{x.so_luong}</td>
              <td>{x.mau_sac}</td>
              <td>{x.loai_xe}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
