import React, { useState, useEffect, useRef } from "react";
import axiosClient from "../api/axiosClient";
import { toast } from "react-toastify";

const NotificationsTester = () => {
  const [userId, setUserId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/";
  const wsBase = apiBase.replace(/^http/, "ws").replace(/\/api\/?$/, "");

  const connectNotifications = () => {
    if (!userId) {
      toast.error("Vui lòng nhập user ID");
      return;
    }
    const url = `${wsBase}/ws/notifications/${userId}/`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setMessages((m) => [...m, { type: "system", text: "Connected to notifications WS" }]);
    };
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setMessages((m) => [...m, { type: data.type || "msg", text: JSON.stringify(data) }]);
      } catch (e) {
        setMessages((m) => [...m, { type: "msg", text: ev.data }]);
      }
    };
    ws.onclose = () => {
      setMessages((m) => [...m, { type: "system", text: "Disconnected" }]);
    };
    ws.onerror = (e) => {
      setMessages((m) => [...m, { type: "error", text: "WebSocket error" }]);
    };
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const sendTestNotification = async () => {
    try {
      const payload = {
        user_id: parseInt(userId),
        type: "payment_success",
        title: "Test Payment",
        message: `This is a test for user ${userId}`,
        order_id: orderId || null,
      };
      const res = await axiosClient.post("notifications/send-test/", payload);
      toast.success("Test notification sent (backend stored)");
      setMessages((m) => [...m, { type: "sent", text: JSON.stringify(res.data) }]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send test notification (check console for details)");
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">WebSocket Notifications Tester</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" className="px-3 py-2 border rounded" />
        <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order ID (optional)" className="px-3 py-2 border rounded" />
        <div className="flex space-x-2">
          <button onClick={connectNotifications} className="px-3 py-2 bg-blue-600 text-white rounded">Connect WS</button>
          <button onClick={disconnect} className="px-3 py-2 bg-gray-500 text-white rounded">Disconnect</button>
          <button onClick={sendTestNotification} className="px-3 py-2 bg-green-600 text-white rounded">Send Test</button>
        </div>
      </div>
      <div className="h-64 overflow-y-auto border rounded p-3 bg-gray-50">
        {messages.map((m, idx) => (
          <div key={idx} className="mb-2">
            <pre className="text-xs whitespace-pre-wrap">{m.text}</pre>
          </div>
        ))}
        {messages.length === 0 && <p className="text-gray-500">No messages yet</p>}
      </div>
    </div>
  );
};

export default NotificationsTester;





