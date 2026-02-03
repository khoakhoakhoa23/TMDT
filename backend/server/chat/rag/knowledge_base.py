"""
Knowledge Base Module - Module quan ly co so kien thuc
Tai du lieu tu database va file tinh, xay dung index
"""

import json
import os
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime

from .models import (
    Document, DocumentType, CarInfo, PolicyInfo, FAQItem
)
from .retrieval import RetrievalService


class KnowledgeBase:
    """
    Quan ly co so kien thuc
    Phu trach tai du lieu tu cac nguon khac nhau va xay dung index
    """
    
    # Duong dan file du lieu tinh
    DATA_DIR = Path(__file__).parent / 'data'
    CARS_FILE = DATA_DIR / 'cars.json'
    POLICIES_FILE = DATA_DIR / 'policies.json'
    FAQ_FILE = DATA_DIR / 'faqs.json'
    
    def __init__(self, index_dir: str = None):
        """
        Khoi tao co so kien thuc
        
        Args:
            index_dir: Thu muc index
        """
        self.retrieval_service = RetrievalService(index_dir)
        self._ensure_data_dir()
    
    def _ensure_data_dir(self):
        """Dam bao thu muc du lieu ton tai"""
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)
        
        # Tao file du lieu mau (neu chua ton tai)
        if not self.CARS_FILE.exists():
            self._create_sample_data()
    
    def _create_sample_data(self):
        """Tao file du lieu mau"""
        # Du lieu xe mau
        sample_cars = [
            {
                "ma_xe": "X001",
                "ten_xe": "Toyota Camry 2024",
                "loai_xe": "Sedan",
                "gia_ban": 1200000000,
                "gia_thue_ngay": 1500000,
                "so_luong": 5,
                "mau_sac": "Trang, Den, Bac",
                "trang_thai": "Con hang",
                "mo_ta": "Toyota Camry 2024 la dong xe sedan hang sang voi thiet ke sang trong, dong co manh me va nhieu tien nghi hien dai.",
                "hop_so": "So tu dong",
                "so_cho": 5,
                "loai_nhien_lieu": "Xang"
            },
            {
                "ma_xe": "X002",
                "ten_xe": "Honda CR-V 2024",
                "loai_xe": "SUV",
                "gia_ban": 1350000000,
                "gia_thue_ngay": 1800000,
                "so_luong": 3,
                "mau_sac": "Trang, Xam",
                "trang_thai": "Con hang",
                "mo_ta": "Honda CR-V 2024 la dong SUV 5 cho, phu hop cho gia dinh voi khong gian rong rai va an toan.",
                "hop_so": "So tu dong",
                "so_cho": 5,
                "loai_nhien_lieu": "Xang"
            },
            {
                "ma_xe": "X003",
                "ten_xe": "Toyota Fortuner 2024",
                "loai_xe": "SUV",
                "gia_ban": 1850000000,
                "gia_thue_ngay": 2500000,
                "so_luong": 2,
                "mau_sac": "Trang, Den, Bac, Xanh",
                "trang_thai": "Con hang",
                "mo_ta": "Toyota Fortuner 2024 la dong SUV 7 cho, manh me va ben bi, phu hop cho nhung chuyen di dai.",
                "hop_so": "So tu dong",
                "so_cho": 7,
                "loai_nhien_lieu": "Dau"
            },
            {
                "ma_xe": "X004",
                "ten_xe": "Mercedes-Benz C-Class",
                "loai_xe": "Sedan hang sang",
                "gia_ban": 2500000000,
                "gia_thue_ngay": 4000000,
                "so_luong": 2,
                "mau_sac": "Trang, Den",
                "trang_thai": "Con hang",
                "mo_ta": "Mercedes-Benz C-Class la dong xe sang trong voi cong nghe tien tien va noi that cao cap.",
                "hop_so": "So tu dong",
                "so_cho": 5,
                "loai_nhien_lieu": "Xang"
            },
            {
                "ma_xe": "X005",
                "ten_xe": "BMW 5 Series",
                "loai_xe": "Sedan hang sang",
                "gia_ban": 2800000000,
                "gia_thue_ngay": 4500000,
                "so_luong": 1,
                "mau_sac": "Den, Xam",
                "trang_thai": "Con hang",
                "mo_ta": "BMW 5 Series mang den trai nghiem lai xe the thao ket hop voi su sang trong va tien nghi.",
                "hop_so": "So tu dong",
                "so_cho": 5,
                "loai_nhien_lieu": "Xang"
            },
            {
                "ma_xe": "X006",
                "ten_xe": "Kia Carnival 2024",
                "loai_xe": "MPV",
                "gia_ban": 1650000000,
                "gia_thue_ngay": 2200000,
                "so_luong": 4,
                "mau_sac": "Trang, Bac, Xam",
                "trang_thai": "Con hang",
                "mo_ta": "Kia Carnival la dong xe 7-11 cho, phu hop cho gia dinh dong nguoi hoac dich vu.",
                "hop_so": "So tu dong",
                "so_cho": 7,
                "loai_nhien_lieu": "Xang"
            },
            {
                "ma_xe": "X007",
                "ten_xe": "Honda Civic 2024",
                "loai_xe": "Sedan",
                "gia_ban": 950000000,
                "gia_thue_ngay": 1200000,
                "so_luong": 6,
                "mau_sac": "Trang, Do, Xanh, Vang",
                "trang_thai": "Con hang",
                "mo_ta": "Honda Civic la dong xe sedan the thao, pho bien voi gia thanh hop ly va tiet kiem nhien lieu.",
                "hop_so": "So tu dong",
                "so_cho": 5,
                "loai_nhien_lieu": "Xang"
            },
            {
                "ma_xe": "X008",
                "ten_xe": "Ford Explorer 2024",
                "loai_xe": "SUV",
                "gia_ban": 1950000000,
                "gia_thue_ngay": 2800000,
                "so_luong": 2,
                "mau_sac": "Trang, Den, Xam",
                "trang_thai": "Con hang",
                "mo_ta": "Ford Explorer la dong SUV 7 cho My, manh me va an toan voi nhieu cong nghe hien dai.",
                "hop_so": "So tu dong",
                "so_cho": 7,
                "loai_nhien_lieu": "Xang"
            },
        ]
        
        # Du lieu chinh sach mau
        sample_policies = [
            {
                "policy_id": "RENT_001",
                "category": "Dat coc",
                "title": "Chinh sach dat coc",
                "content": "De dat xe, khach hang can dat coc 50% gia thue xe theo ngay. Tien coc se duoc hoan tra sau khi tra xe va kiem tra xe khong co hu hai.",
                "conditions": ["Dat coc 50%", "Hoan tra khi tra xe", "Khong hu hai"]
            },
            {
                "policy_id": "RENT_002",
                "category": "Giay to",
                "title": "Yeu cau giay to thue xe",
                "content": "Khach hang can cung cap: 1) CMND/CCCD goc; 2) Giay phep lai xe (B2 tro len); 3) Ho khau hoac KT3; 4) Dat coc tien mat hoac the chap xe may.",
                "conditions": ["CMND/CCCD", "GPLX B2+", "Ho khau/KT3", "Dat coc"]
            },
            {
                "policy_id": "RENT_003",
                "category": "Phi phat sinh",
                "title": "Cac loai phi phat sinh khi thue xe",
                "content": "Phi phat sinh bao gom: Phi vuot so km quy dinh (3.000 VND/km); Phi lai xe them (300.000 VND/ngay); Phi don xe neu tra xe ban (200.000 VND); Phi tre gio tra (gia thue/24 x so gio tre).",
                "conditions": ["Vuot km: 3.000 VND/km", "Lai xe them: 300.000 VND/ngay", "Don xe: 200.000 VND", "Tre gio: tinh theo gia thue"]
            },
            {
                "policy_id": "RENT_004",
                "category": "Bao hiem",
                "title": "Bao hiem thue xe",
                "content": "Gia thue xe da bao gom bao hiem trach nhiem dan su. Khach hang co the mua them bao hiem vat chat (CDW) voi phi 10% gia thue/ngay de giam trach nhiem boi thuong khi xay ra tai nan.",
                "conditions": ["Bao hiem TNDS: da bao gom", "Bao hiem CDW: 10%/ngay"]
            },
            {
                "policy_id": "CANCEL_001",
                "category": "Huy dat",
                "title": "Chinh sach huy dat xe",
                "content": "Chinh sach huy dat: Huy truoc 48 gio: hoan 100% tien coc; Huy truoc 24-48 gio: hoan 50% tien coc; Huy trong 24 gio: khong hoan tien coc. Truong hop bat kha khang duoc xem xet rieng.",
                "conditions": ["48h truoc: hoan 100%", "24-48h: hoan 50%", "Duoi 24h: khong hoan"]
            },
            {
                "policy_id": "SALE_001",
                "category": "Ban xe",
                "title": "Chinh sach ban xe",
                "content": "TMDT ho tro mua ban xe o to moi va cu voi gia canh tranh. Khach hang duoc ho tro vay mua xe voi lai suat uu dai 0% trong 12 thang (neu du dieu kien).",
                "conditions": ["Gia canh tranh", "Ho tro vay 0% 12 thang", "Bao hanh chinh hang"]
            },
        ]
        
        # Du lieu FAQ mau
        sample_faqs = [
            {
                "faq_id": "FAQ_001",
                "question": "Thue xe can nhung giay to gi?",
                "answer": "De thue xe, ban can chuan bi: CMND/CCCD goc, Giay phep lai xe (loai B2 tro len), va dat coc tien mat hoac the chap xe may. Neu ban la nguoi nuoc ngoai, can them ho chieu va visa valid.",
                "category": "Thue xe",
                "keywords": ["thue xe", "giay to", "dieu kien", "CMND", "GPLX"]
            },
            {
                "faq_id": "FAQ_002",
                "question": "Gia thue xe co bao gom xang khong?",
                "answer": "Gia thue xe khong bao gom xang. Ban se nhan xe voi binh xang day va phai tra xe voi muc xang tuong duong. Neu tra xe thieu xang, phi se duoc tinh theo gia thi truong cong them 10%.",
                "category": "Thue xe",
                "keywords": ["thue xe", "xang", "gia thue", "nhien lieu"]
            },
            {
                "faq_id": "FAQ_003",
                "question": "Co the giao xe tan noi khong?",
                "answer": "Co, TMDT ho tro giao xe tan noi trong noi thanh TP.HCM voi phi 100.000 VND. Voi cac tinh thanh khac, phi giao xe se duoc bao cu the theo khoang cach. Doi voi san bay, chung toi co dich vu don khach mien phi.",
                "category": "Dich vu",
                "keywords": ["giao xe", "dia diem", "don khach", "san bay"]
            },
            {
                "faq_id": "FAQ_004",
                "question": "Toi co the thue xe o dia diem khac de tra khong?",
                "answer": "Co, ban co the thue va tra xe o cac dia diem khac nhau (one-way). Tuy nhien, se co phu thu one-way tu 200.000 - 500.000 VND tuy theo khoang cach. Vui long lien he truoc de duoc bao gia chinh xac.",
                "category": "Thue xe",
                "keywords": ["thue xe", "tra xe", "dia diem", "one-way"]
            },
            {
                "faq_id": "FAQ_005",
                "question": "Neu xe hong hoac gap su co trong qua trinh thue thi sao?",
                "answer": "Neu xe gap su co, hay lien he ngay hotline 1900 xxxx. TMDT se ho tro 24/7. Trong truong hop xe khong the tiep tuc di chuyen, chung toi se xe den ho tro hoac thay the xe moi neu can thiet (mien phi neu loi tu phia cong ty).",
                "category": "Ho tro",
                "keywords": ["xe hong", "su co", "ho tro", "hotline", "24/7"]
            },
            {
                "faq_id": "FAQ_006",
                "question": "Toi co the thanh toan bang nhung phuong thuc nao?",
                "answer": "TMDT chap nhan nhieu phuong thuc thanh toan: Tien mat, Chuyen khoan ngan hang, The Visa/Mastercard, Dien tu (MoMo, ZaloPay, VNPay). Doi voi hop dong dai han, co the thanh toan theo tuan/thang.",
                "category": "Thanh toan",
                "keywords": ["thanh toan", "tien mat", "chuyen khoan", "the", "vi dien tu"]
            },
            {
                "faq_id": "FAQ_007",
                "question": "Co can tai xe khong?",
                "answer": "Ban co the tu lai xe neu co GPLX phu hop. Neu muon co tai xe, chung toi cung cap dich vu tai xe voi phi 300.000 VND/ngay. Tai xe cua TMDT am hieu duong sa va thong thao tieng Anh neu can.",
                "category": "Dich vu",
                "keywords": ["tai xe", "lai xe", "dich vu", "GPLX"]
            },
            {
                "faq_id": "FAQ_008",
                "question": "Thue xe may co duoc khong?",
                "answer": "Hien tai TMDT chi cung cap dich vu thue o to (4 cho, 7 cho, xe sang). Neu ban can thue xe may, vui long lien he doi tac khac. Chung toi co the gioi thieu neu ban can.",
                "category": "Thue xe",
                "keywords": ["xe may", "motor", "thue xe", "o to"]
            },
            {
                "faq_id": "FAQ_009",
                "question": "Thoi gian mo cua cua TMDT?",
                "answer": "TMDT lam viec tu 8:00 - 20:00 tat ca cac ngay trong tuan (ke ca le, Tet). Dich vu ho tro khan cap 24/7 qua hotline. Ban co the dat xe online 24/7 va nhan xac nhan trong gio lam viec.",
                "category": "Thong tin",
                "keywords": ["gio lam viec", "hotline", "lien he", "ho tro"]
            },
            {
                "faq_id": "FAQ_010",
                "question": "Lam sao de dat xe?",
                "answer": "Ban co the dat xe theo cac cach sau: 1) Dat truc tiep tren website TMDT; 2) Goi hotline 1900 xxxx; 3) Den truc tiep van phong TMDT; 4) Nhan tin qua Zalo OA. Sau khi dat, ban se nhan duoc xac nhan va thong tin chi tiet qua SMS/Email.",
                "category": "Dat xe",
                "keywords": ["dat xe", "booking", "website", "hotline", "lien he"]
            },
        ]
        
        # Luu vao file
        with open(self.CARS_FILE, 'w', encoding='utf-8') as f:
            json.dump(sample_cars, f, ensure_ascii=False, indent=2)
        
        with open(self.POLICIES_FILE, 'w', encoding='utf-8') as f:
            json.dump(sample_policies, f, ensure_ascii=False, indent=2)
        
        with open(self.FAQ_FILE, 'w', encoding='utf-8') as f:
            json.dump(sample_faqs, f, ensure_ascii=False, indent=2)
    
    def load_cars_from_db(self) -> List[CarInfo]:
        """
        Tai du lieu xe tu database
        
        Returns:
            Danh sach thong tin xe
        """
        try:
            from products.models import Xe
            cars = Xe.objects.all()
            
            car_infos = []
            for xe in cars:
                car_info = CarInfo(
                    ma_xe=xe.ma_xe,
                    ten_xe=xe.ten_xe,
                    loai_xe=xe.loai_xe.ten_loai if xe.loai_xe else 'Khac',
                    gia_ban=xe.gia or 0,
                    gia_thue_ngay=xe.gia_thue or 0,
                    so_luong=xe.so_luong,
                    mau_sac=xe.mau_sac,
                    trang_thai=xe.trang_thai,
                    mo_ta=xe.mo_ta_ngan or xe.mo_ta or '',
                    hop_so=dict(Xe._meta.get_field('hop_so').choices).get(
                        xe.hop_so, xe.hop_so
                    ),
                    so_cho=xe.so_cho,
                    loai_nhien_lieu=dict(Xe._meta.get_field('loai_nhien_lieu').choices).get(
                        xe.loai_nhien_lieu, xe.loai_nhien_lieu
                    ),
                )
                car_infos.append(car_info)
            
            return car_infos
        except Exception as e:
            print(f"Error loading cars from DB: {e}")
            return []
    
    def load_cars_from_file(self) -> List[CarInfo]:
        """
        Tai du lieu xe tu file JSON
        
        Returns:
            Danh sach thong tin xe
        """
        if not self.CARS_FILE.exists():
            return []
        
        with open(self.CARS_FILE, 'r', encoding='utf-8') as f:
            cars_data = json.load(f)
        
        return [
            CarInfo(
                ma_xe=c['ma_xe'],
                ten_xe=c['ten_xe'],
                loai_xe=c['loai_xe'],
                gia_ban=c['gia_ban'],
                gia_thue_ngay=c['gia_thue_ngay'],
                so_luong=c['so_luong'],
                mau_sac=c['mau_sac'],
                trang_thai=c['trang_thai'],
                mo_ta=c['mo_ta'],
                hop_so=c['hop_so'],
                so_cho=c['so_cho'],
                loai_nhien_lieu=c['loai_nhien_lieu'],
            )
            for c in cars_data
        ]
    
    def load_policies_from_file(self) -> List[PolicyInfo]:
        """
        Tai du lieu chinh sach tu file JSON
        
        Returns:
            Danh sach thong tin chinh sach
        """
        if not self.POLICIES_FILE.exists():
            return []
        
        with open(self.POLICIES_FILE, 'r', encoding='utf-8') as f:
            policies_data = json.load(f)
        
        return [
            PolicyInfo(
                policy_id=p['policy_id'],
                category=p['category'],
                title=p['title'],
                content=p['content'],
                conditions=p.get('conditions', []),
            )
            for p in policies_data
        ]
    
    def load_faqs_from_file(self) -> List[FAQItem]:
        """
        Tai du lieu FAQ tu file JSON
        
        Returns:
            Danh sach cau hoi thuong gap
        """
        if not self.FAQ_FILE.exists():
            return []
        
        with open(self.FAQ_FILE, 'r', encoding='utf-8') as f:
            faqs_data = json.load(f)
        
        return [
            FAQItem(
                faq_id=f['faq_id'],
                question=f['question'],
                answer=f['answer'],
                category=f['category'],
                keywords=f.get('keywords', []),
            )
            for f in faqs_data
        ]
    
    def build_index(
        self,
        use_db: bool = False,
        include_cars: bool = True,
        include_policies: bool = True,
        include_faqs: bool = True
    ):
        """
        Xay dung index cho co so kien thuc
        
        Args:
            use_db: Co tai du lieu xe tu database khong
            include_cars: Co bao gom du lieu xe khong
            include_policies: Co bao gom du lieu chinh sach khong
            include_faqs: Co bao gom du lieu FAQ khong
        """
        documents = []
        
        # Tai du lieu xe
        if include_cars:
            if use_db:
                cars = self.load_cars_from_db()
            else:
                cars = self.load_cars_from_file()
            
            for car in cars:
                documents.append(car.to_document())
        
        # Tai du lieu chinh sach
        if include_policies:
            policies = self.load_policies_from_file()
            for policy in policies:
                documents.append(policy.to_document())
        
        # Tai du lieu FAQ
        if include_faqs:
            faqs = self.load_faqs_from_file()
            for faq in faqs:
                documents.append(faq.to_document())
        
        # Them vao retrieval service
        if documents:
            self.retrieval_service.add_documents(documents)
        
        return len(documents)
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Lay thong tin thong ke cua co so kien thuc
        
        Returns:
            Thong tin thong ke
        """
        stats = self.retrieval_service.get_index_stats()
        
        # Bo sung thong tin file
        stats['files'] = {
            'cars': str(self.CARS_FILE),
            'policies': str(self.POLICIES_FILE),
            'faqs': str(self.FAQ_FILE),
        }
        
        return stats
    
    def add_car(self, car: CarInfo):
        """
        Them thong tin xe
        
        Args:
            car: Thong tin xe
        """
        self.retrieval_service.add_document(car.to_document())
        self.retrieval_service._save_index()
    
    def add_policy(self, policy: PolicyInfo):
        """
        Them thong tin chinh sach
        
        Args:
            policy: Thong tin chinh sach
        """
        self.retrieval_service.add_document(policy.to_document())
        self.retrieval_service._save_index()
    
    def add_faq(self, faq: FAQItem):
        """
        Them cau hoi thuong gap
        
        Args:
            faq: Cau hoi thuong gap
        """
        self.retrieval_service.add_document(faq.to_document())
        self.retrieval_service._save_index()
    
    def search(self, query: str, top_k: int = None):
        """
        Tim kiem trong co so kien thuc
        
        Args:
            query: Van ban truy van
            top_k: So luong ket qua tra ve
            
        Returns:
            Ket qua tim kiem
        """
        return self.retrieval_service.search(query, top_k)
    
    def clear(self):
        """Xoa sach co so kien thuc"""
        self.retrieval_service.clear_index()


# Ham tien dung
def get_knowledge_base(index_dir: str = None) -> KnowledgeBase:
    """Lay instance co so kien thuc"""
    return KnowledgeBase(index_dir)


def build_knowledge_base(
    index_dir: str = None,
    use_db: bool = False
) -> KnowledgeBase:
    """
    Xay dung co so kien thuc va tra ve instance
    
    Args:
        index_dir: Thu muc index
        use_db: Co tai tu database khong
        
    Returns:
        Instance KnowledgeBase
    """
    kb = KnowledgeBase(index_dir)
    kb.build_index(use_db=use_db)
    return kb
