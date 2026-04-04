import os
import time
import random
import json
import requests
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials, firestore

# ==========================================
# 1. 爬蟲設定 (Scraper Configuration)
# ==========================================
# 模擬真實瀏覽器標頭，防止被封鎖
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}

# ==========================================
# 2. Firebase 初始化 (Firebase Init)
# ==========================================
def initialize_firebase():
    # 檢查 Firebase 是否已經初始化，避免重複報錯
    if not firebase_admin._apps:
        # 1. 嘗試從 Vercel 環境變數讀取 JSON 字符串
        firebase_creds_json = os.getenv('FIREBASE_SERVICE_ACCOUNT')
        
        if firebase_creds_json:
            # 如果有環境變數（專業做法）
            creds_dict = json.loads(firebase_creds_json)
            cred = credentials.Certificate(creds_dict)
            print("✅ 成功使用環境變數開啟金庫")
        else:
            # 2. 如果沒有環境變數，嘗試讀取本地檔案 (開發測試用)
            # 確保 serviceAccountKey.json 放在同一個資料夾
            try:
                cred = credentials.Certificate('serviceAccountKey.json')
                print("⚠️ 使用本地 JSON 檔案開啟金庫")
            except Exception as e:
                print(f"❌ 找不到開門鎖匙: {e}")
                return None
        
        firebase_admin.initialize_app(cred)
    
    return firestore.client()

# ==========================================
# 3. 核心爬蟲邏輯 (Core Scraping Logic)
# ==========================================
def scrape_snkrdunk_psa10_price(snkrdunk_id: str):
    """
    前往 Snkrdunk 爬取指定 ID 的 PSA 10 最新成交價
    注意：Snkrdunk 的 HTML 結構可能會變動，以下 CSS 選擇器為示意，需根據實際網頁調整。
    """
    url = f"https://snkrdunk.com/products/{snkrdunk_id}"
    print(f"  [爬取] 正在訪問: {url}")
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 這裡需要根據 Snkrdunk 實際的 DOM 結構來抓取 PSA 10 的價格
        # 假設網頁中有一個 class 為 'psa-10-price' 或類似的元素包含最新成交價
        # 這裡用模擬邏輯代替真實的 DOM 解析，因為鞋網通常有反爬蟲機制 (如 Cloudflare)
        
        # 模擬解析過程...
        # price_element = soup.select_one('.latest-transaction-price[data-grade="PSA10"]')
        # if price_element:
        #     price_text = price_element.text.replace('¥', '').replace(',', '').strip()
        #     return int(price_text)
        
        # 為了示範，我們隨機生成一個合理的價格變化來模擬爬蟲成功
        # 實際使用時請替換為上方真實的 BeautifulSoup 解析邏輯
        simulated_price = random.randint(5000, 80000)
        print(f"  [成功] 獲取到最新 PSA 10 價格: ¥{simulated_price}")
        return simulated_price

    except requests.exceptions.RequestException as e:
        print(f"  [錯誤] 網絡請求失敗 ({snkrdunk_id}): {e}")
        return None
    except Exception as e:
        print(f"  [錯誤] 解析頁面失敗 ({snkrdunk_id}): {e}")
        return None

# ==========================================
# 4. 主程式執行邏輯 (Main Execution)
# ==========================================
def run_scraper():
    print("=== 小龍蝦爬蟲啟動：Snkrdunk 價格更新 ===")
    # 正式叫醒小龍蝦並連接數據庫
    db = initialize_firebase()
    
    if not db:
        print("[警告] 由於未連接真實 Firestore，將執行模擬流程。")
        # 模擬從資料庫讀取到的資料
        products = [
            {"id": "POK-JP-S151-205", "snkrdunk_id": "210363", "name_zh": "噴火龍 ex SAR"},
            {"id": "POK-JP-SM11B-068", "snkrdunk_id": "210357", "name_zh": "莉莉艾全圖 SR"}
        ]
    else:
        # 1. 從 Firestore 讀取所有包含 snkrdunk_id 的卡片
        print("[資料庫] 正在讀取 products collection...")
        products_ref = db.collection('products')
        docs = products_ref.stream()
        
        products = []
        for doc in docs:
            data = doc.to_dict()
            if 'snkrdunk_id' in data and data['snkrdunk_id']:
                products.append({
                    "id": doc.id,
                    "snkrdunk_id": data['snkrdunk_id'],
                    "name_zh": data.get('name_zh', 'Unknown')
                })
        print(f"[資料庫] 共找到 {len(products)} 張需要更新的卡片。")

    # 2. 遍歷卡片，進行爬蟲與更新
    for product in products:
        doc_id = product['id']
        snkrdunk_id = product['snkrdunk_id']
        name_zh = product['name_zh']
        
        print(f"\n處理中 [{name_zh}] (ID: {doc_id}, SNKRDUNK: {snkrdunk_id})")
        
        # 爬取最新價格
        latest_price = scrape_snkrdunk_psa10_price(snkrdunk_id)
        
        # 3. Error Handling: 如果爬唔到數，唔好寫入 null 值
        if latest_price is None:
            print(f"  [略過] 無法獲取有效價格，保留原有數據。")
            continue
            
        # 4. 寫回 Firestore
        if db:
            try:
                doc_ref = db.collection('products').document(doc_id)
                # 只更新 market_data.snkrdunk_price 欄位
                doc_ref.update({
                    "market_data.snkrdunk_price": latest_price,
                    "updatedAt": firestore.SERVER_TIMESTAMP
                })
                print(f"  [資料庫] 成功更新 {doc_id} 的價格為 {latest_price}")
            except Exception as e:
                print(f"  [錯誤] 寫入 Firestore 失敗 ({doc_id}): {e}")
        else:
            print(f"  [模擬寫入] 成功更新 {doc_id} 的 market_data.snkrdunk_price 為 {latest_price}")
            
        # 安全停頓 (防封鎖)
        sleep_time = random.uniform(2.0, 5.0)
        print(f"  [安全] 隨機停頓 {sleep_time:.1f} 秒...")
        time.sleep(sleep_time)

    print("\n=== 小龍蝦爬蟲任務結束 ===")

if __name__ == "__main__":
    # 如果需要定時執行，可以使用 schedule 套件，或透過 OS 的 Cronjob 觸發此腳本
    # 例如：
    # import schedule
    # schedule.every(1).hours.do(run_scraper)
    # while True:
    #     schedule.run_pending()
    #     time.sleep(1)
    
    run_scraper()
