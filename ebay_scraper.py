import os
import time
import random
import uuid
import hashlib
import requests
from bs4 import BeautifulSoup
# import firebase_admin
# from firebase_admin import credentials, firestore, storage

# ==========================================
# 1. 爬蟲設定 (Scraper Configuration)
# ==========================================
# 模擬真實瀏覽器標頭，防止被封鎖
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}

# 目標搜尋關鍵字與卡片 ID
SEARCH_QUERY = "Lugia V SA 110/098"
CARD_ID = "s12a_110"

# eBay 搜尋 URL (已包含 Sold Items 和 Graded 篩選條件的參數)
# LH_Sold=1 (Sold Items), LH_Complete=1 (Completed Items), LH_ItemCondition=1000 (New/Graded)
EBAY_SEARCH_URL = f"https://www.ebay.com/sch/i.html?_nkw={SEARCH_QUERY.replace(' ', '+')}&LH_Sold=1&LH_Complete=1&LH_ItemCondition=1000"

# ==========================================
# 2. Firebase 初始化 (Firebase Init)
# ==========================================
# 注意：實際執行前需要準備 serviceAccountKey.json 並解除註解
def init_firebase():
    """初始化 Firebase Admin SDK"""
    # cred = credentials.Certificate("serviceAccountKey.json")
    # firebase_admin.initialize_app(cred, {
    #     'storageBucket': 'your-project-id.appspot.com' # 替換為你的 Storage Bucket
    # })
    # return firestore.client(), storage.bucket()
    print("[Firebase] 模擬初始化 (未連接真實資料庫)")
    return None, None

# ==========================================
# 3. 核心爬蟲與處理邏輯 (Core Logic)
# ==========================================
def generate_image_hash(image_content: bytes) -> str:
    """生成圖片的 MD5 Hash，用於去重"""
    return hashlib.md5(image_content).hexdigest()

def determine_style_tier(title: str) -> str:
    """根據標題判斷圖片風格 (premium 或 raw)"""
    title_upper = title.upper()
    if "PSA" in title_upper or "BGS" in title_upper or "CGC" in title_upper:
        return "premium"
    return "raw"

def scrape_ebay_sold_items(db, bucket):
    """爬取 eBay 已成交商品並處理圖片"""
    print(f"開始搜尋 eBay: {SEARCH_QUERY}")
    
    try:
        response = requests.get(EBAY_SEARCH_URL, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 尋找所有商品列表項目 (eBay 的 class 名稱可能會變，需根據實際情況調整)
        items = soup.select('.s-item__wrapper')
        print(f"找到 {len(items)} 個潛在結果。")

        processed_count = 0

        for item in items:
            # 1. 提取標題
            title_elem = item.select_one('.s-item__title')
            if not title_elem or "Shop on eBay" in title_elem.text: # 忽略廣告
                continue
            title = title_elem.text.strip()

            # 2. 提取圖片 URL (eBay 通常將高畫質圖片放在 data-src 或 src)
            img_elem = item.select_one('.s-item__image-img')
            if not img_elem:
                continue
            
            img_url = img_elem.get('data-src') or img_elem.get('src')
            if not img_url or "ir.ebaystatic.com" in img_url: # 忽略佔位圖
                continue
            
            # 將 s-l225 (縮圖) 替換為 s-l1600 (高畫質圖)
            img_url = img_url.replace('s-l225', 's-l1600').replace('s-l500', 's-l1600')

            print(f"\n[處理中] 標題: {title}")
            print(f"圖片 URL: {img_url}")

            # 3. 下載圖片並計算 Hash
            try:
                img_response = requests.get(img_url, headers=HEADERS, timeout=10)
                img_response.raise_for_status()
                img_content = img_response.content
                img_hash = generate_image_hash(img_content)
            except Exception as e:
                print(f"[錯誤] 下載圖片失敗: {e}")
                continue

            # 4. 去重檢查 (模擬 Firestore 查詢)
            # if db:
            #     existing = db.collection('image_library').where('hash', '==', img_hash).limit(1).get()
            #     if existing:
            #         print(f"[跳過] 圖片已存在 (Hash: {img_hash})")
            #         continue
            
            print(f"[Hash] 生成成功: {img_hash}")

            # 5. 判斷風格
            style_tier = determine_style_tier(title)
            print(f"[風格] 判定為: {style_tier.upper()}")

            # 6. 上傳至 Firebase Storage (模擬)
            iid = str(uuid.uuid4())
            file_extension = img_url.split('.')[-1].split('?')[0] or 'jpg'
            storage_path = f"image_library/{CARD_ID}/{style_tier}/{iid}.{file_extension}"
            
            # if bucket:
            #     blob = bucket.blob(storage_path)
            #     blob.upload_from_string(img_content, content_type=f'image/{file_extension}')
            #     blob.make_public()
            #     public_url = blob.public_url
            # else:
            public_url = f"https://mock-storage.com/{storage_path}" # 模擬 URL
            
            print(f"[上傳] 模擬上傳至 Storage: {storage_path}")

            # 7. 寫入 Firestore Metadata (模擬)
            metadata = {
                "iid": iid,
                "card_id": CARD_ID,
                "url": public_url,
                "style_tier": style_tier,
                "is_used": False,
                "hash": img_hash,
                "source_title": title, # 記錄來源標題方便後續查驗
                "created_at": firestore.SERVER_TIMESTAMP if 'firestore' in globals() else time.time()
            }
            
            # if db:
            #     db.collection('image_library').document(iid).set(metadata)
            
            print(f"[資料庫] 模擬寫入 Metadata: {metadata['iid']}")
            processed_count += 1

            # 8. 安全停頓 (防封鎖)
            sleep_time = random.uniform(3.0, 5.0)
            print(f"[安全] 隨機停頓 {sleep_time:.2f} 秒...")
            time.sleep(sleep_time)

            # 為了測試，只處理前 3 個結果
            if processed_count >= 3:
                print("\n[測試] 已達到測試數量上限 (3)，停止爬取。")
                break

    except Exception as e:
        print(f"[嚴重錯誤] 爬蟲執行失敗: {e}")

# ==========================================
# 4. 執行入口 (Main)
# ==========================================
if __name__ == "__main__":
    print("=== TCG INVEST 圖片資料庫進貨爬蟲啟動 ===")
    db_client, storage_bucket = init_firebase()
    scrape_ebay_sold_items(db_client, storage_bucket)
    print("=== 爬蟲任務結束 ===")
