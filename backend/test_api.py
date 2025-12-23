#!/usr/bin/env python
"""Quick test script to check if API is working"""
import requests
import json

try:
    response = requests.get("http://127.0.0.1:8000/api/xe/")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("API hoat dong!")
        print(f"So luong xe: {len(data.get('results', data))}")
        if 'results' in data:
            print(f"Pagination: {data.get('count', 0)} tong cong")
        print("\nDanh sach xe:")
        cars = data.get('results', data) if isinstance(data, dict) else data
        for i, car in enumerate(cars[:5], 1):  # Chỉ hiển thị 5 xe đầu
            print(f"{i}. {car.get('ten_xe', 'N/A')} - {car.get('gia_thue', 'N/A')} VND/ngay")
    else:
        print(f"Loi: {response.status_code}")
        print(response.text)
except requests.exceptions.ConnectionError:
    print("Khong the ket noi den server. Dam bao server dang chay tren http://127.0.0.1:8000")
except Exception as e:
    print(f"Loi: {e}")

