import os
import time
import random
import uuid
import json
from datetime import datetime

# 嘗試導入 Gemini SDK (如果沒有安裝，請執行 pip install google-genai)
try:
    from google import genai
    from google.genai import types
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
    print("[Warning] 未安裝 google-genai，將使用模擬文案。請執行: pip install google-genai")

# 嘗試導入之前寫好的派相模組
try:
    from image_dispatcher import get_unique_image_for_post
except ImportError:
    print("[Warning] 找不到 image_dispatcher.py，將使用模擬派相函數。")
    def get_unique_image_for_post(uid, card_id, action, db_client=None, storage_bucket=None):
        return {"url": f"https://mock-storage.com/{card_id}_mock.jpg", "style_tier": "raw", "iid": "mock_123"}

import firebase_admin
from firebase_admin import credentials, firestore

# ==========================================
# 1. 初始化與設定 (Init & Config)
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

def init_gemini():
    """初始化 Gemini API Client"""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[Gemini] 警告: 未設定 GEMINI_API_KEY 環境變數。")
        return None
    if HAS_GEMINI:
        return genai.Client(api_key=api_key)
    return None

# 模擬卡片資料庫 (包含市場參考價 HKD)
MOCK_CARDS = [
    {"id": "s12a_110", "name": "Lugia V SA 110/098", "market_price": 1500},
    {"id": "sv2a_201", "name": "Charizard ex SAR 201/165", "market_price": 850},
    {"id": "s8b_276", "name": "Pikachu VMAX UR 276/184", "market_price": 320},
    {"id": "sv4a_349", "name": "Iono SAR 349/190", "market_price": 680},
]

# ==========================================
# 2. 數據獲取邏輯 (Data Fetching)
# ==========================================
def get_random_user(db_client):
    """從 Firestore 隨機抽取一個 User (這裡使用 mock_users.json 模擬)"""
    # if db_client:
    #     # Firestore 隨機抽取通常需要一些特殊技巧 (例如 random ID 比較)，這裡簡化示意
    #     users_ref = db_client.collection('users')
    #     # ... 實際查詢邏輯 ...
    
    try:
        with open('mock_users.json', 'r', encoding='utf-8') as f:
            users = json.load(f)
            return random.choice(users)
    except FileNotFoundError:
        # Fallback 假數據
        return {
            "uid": f"U{random.randint(1000, 9999)}",
            "display_name": "Mock_User",
            "identity_tier": random.choice(["gold", "silver", "bronze"]),
            "visual_tags": ["fast_reply"]
        }

# ==========================================
# 3. AI 文案生成 (Gemini Prompting)
# ==========================================
def generate_post_content(gemini_client, user, card, action, price):
    """根據賣家等級與行為生成地道文案"""
    tier = user.get("identity_tier", "bronze")
    trade_methods = ["面交 (旺角/油麻地)", "順豐到付", "平郵 (買家承擔風險)"]
    trade_method = random.choice(trade_methods)
    
    if action == "sell":
        condition = "PSA 10" if tier == "gold" else random.choice(["99% New", "完美品", "微白邊", "入套即閃"])
        
        if tier == "gold":
            prompt = f"""
            你是一個香港專業的 Pokémon 卡牌投資者與認證賣家。請寫一篇賣卡貼文。
            卡名：{card['name']}
            價格：HKD ${price}
            卡況：{condition}
            交收方式：{trade_method}
            
            要求：
            1. 語氣專業、有說服力，強調卡片的保值潛力、品相完美（如 PSA 10 級別）。
            2. 提及自己是信譽賣家，包裝穩妥。
            3. 使用繁體中文（香港習慣用語），適量使用 emoji (🔥, 📈, 💎)。
            4. 字數約 80-120 字。直接輸出貼文內容，不要包含任何開場白。
            """
        else:
            prompt = f"""
            你是一個香港普通的 Pokémon 卡牌玩家。請寫一篇賣卡貼文。
            卡名：{card['name']}
            價格：HKD ${price}
            卡況：{condition}
            交收方式：{trade_method}
            
            要求：
            1. 語氣地道、隨性，使用香港網上交易平台 (如 Carousell, 連登) 的常用語。
            2. 可以加入例如「退坑」、「急放」、「回血」、「執雞」、「靚相」、「可小議」等字眼。
            3. 使用繁體中文（廣東話口語），適量使用 emoji (🙏, 🙇‍♂️, 📦)。
            4. 字數約 50-100 字。直接輸出貼文內容，不要包含任何開場白。
            """
    else: # buy (徵卡)
        prompt = f"""
        你是一個香港 Pokémon 卡牌玩家。請寫一篇「徵卡 (收卡)」貼文。
        目標卡名：{card['name']}
        目標價格：HKD ${price} 左右
        交收方式：{trade_method}
        
        要求：
        1. 語氣誠懇，表示真心想收。
        2. 說明要求卡況 (例如：唔要白邊、要靚品)。
        3. 使用繁體中文（廣東話口語），適量使用 emoji。
        4. 字數約 50-80 字。直接輸出貼文內容。
        """

    if gemini_client:
        try:
            response = gemini_client.models.generate_content(
                model='gemini-3.1-flash-preview',
                contents=prompt,
            )
            return response.text.strip()
        except Exception as e:
            print(f"[Gemini Error] 文案生成失敗: {e}")
    
    # Fallback 文案
    if action == "sell":
        return f"【出售】{card['name']}\n💰 價錢: ${price}\n✨ 卡況: {condition}\n🤝 交收: {trade_method}\n有意請 PM！"
    else:
        return f"【誠徵】{card['name']}\n💰 目標價: ${price}\n🤝 交收: {trade_method}\n求靚品，有意放請 PM 報價帶圖，thx！"

# ==========================================
# 4. 主發布邏輯 (Post Creation)
# ==========================================
def create_automated_post(db_client, gemini_client):
    """執行一次完整的自動發布流程"""
    print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 開始執行自動發布任務...")
    
    # 1. 決定 Action (80% 賣卡, 20% 徵卡)
    action = "sell" if random.random() < 0.8 else "buy"
    
    # 2. 抽取 User 與 Card
    user = get_random_user(db_client)
    card = random.choice(MOCK_CARDS)
    
    # 3. 計算價格 (市場價 +/- 5%)
    price_variance = random.uniform(0.95, 1.05)
    final_price = int(card['market_price'] * price_variance)
    # 齊頭處理 (例如 1523 -> 1520)
    final_price = round(final_price / 10) * 10
    
    print(f"-> 選擇用戶: {user['display_name']} (Tier: {user['identity_tier']})")
    print(f"-> 選擇卡片: {card['name']} | 動作: {action.upper()} | 價格: HKD ${final_price}")

    # 4. 獲取圖片 (調用 image_dispatcher 邏輯)
    image_data = get_unique_image_for_post(user['uid'], card['id'], action, db_client)
    image_url = image_data['url'] if image_data else f"https://mock-storage.com/fallback_{card['id']}.jpg"
    
    # 5. 生成文案
    content = generate_post_content(gemini_client, user, card, action, final_price)
    print(f"-> 生成文案:\n{'-'*30}\n{content}\n{'-'*30}")

    # 6. 寫入 Firestore
    post_id = f"post_{uuid.uuid4().hex[:8]}"
    post_data = {
        "post_id": post_id,
        "author_id": user['uid'],
        "author_name": user['display_name'],
        "author_tier": user['identity_tier'],
        "action": action,
        "card_id": card['id'],
        "card_name": card['name'],
        "price": final_price,
        "content": content,
        "image_url": image_url,
        # "created_at": firestore.SERVER_TIMESTAMP
        "created_at": datetime.now().isoformat()
    }
    
    # if db_client:
    #     db_client.collection('posts').document(post_id).set(post_data)
    
    print(f"[Success] 貼文已成功發布！Post ID: {post_id}")

# ==========================================
# 5. 定時執行器 (Scheduler)
# ==========================================
def main_loop():
    print("=== TCG INVEST 全自動上架機器人 (The Brain) 啟動 ===")
    # 正式叫醒小龍蝦並連接數據庫
    db_client = initialize_firebase()
    gemini_client = init_gemini()
    
    # 執行間隔 (45 分鐘 = 45 * 60 秒)
    INTERVAL_SECONDS = 45 * 60
    
    # 為了測試，第一次啟動時先跑一次
    create_automated_post(db_client, gemini_client)
    
    print(f"\n進入定時模式，每 {INTERVAL_SECONDS / 60} 分鐘執行一次...")
    while True:
        try:
            # 為了測試方便，這裡可以改成 sleep(10) 觀察效果
            # time.sleep(10) 
            time.sleep(INTERVAL_SECONDS)
            create_automated_post(db_client, gemini_client)
        except KeyboardInterrupt:
            print("\n機器人已手動停止。")
            break
        except Exception as e:
            print(f"[Error] 迴圈發生未預期錯誤: {e}")
            # 發生錯誤時休息 1 分鐘再試，避免無限 Error Loop
            time.sleep(60)

if __name__ == "__main__":
    main_loop()
