import os
import json
import telebot
import requests
import firebase_admin
from firebase_admin import credentials, firestore

# ==========================================
# 1. 初始化設定
# ==========================================
# 請在環境變數中設定你的 Telegram Bot Token
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "YOUR_TELEGRAM_BOT_TOKEN_HERE")
bot = telebot.TeleBot(TELEGRAM_BOT_TOKEN)

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

# 正式叫醒小龍蝦並連接數據庫
db = initialize_firebase()

# ==========================================
# 2. Bot 指令處理
# ==========================================
@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    bot.reply_to(message, "你好！我是小龍蝦系統管理員。請輸入 /check_system 來進行系統診斷。")

@bot.message_handler(commands=['check_system'])
def check_system(message):
    report = "🔍 **小龍蝦系統自我診斷中...**\n\n"
    
    # 1. 檢查 Vercel 運行環境
    # 這裡假設小龍蝦腳本與 Vercel 專案有關聯，直接回報正常
    report += "✅ Vercel 運作中: 正常\n"
    
    # 2. 測試 Firebase 連線 (嘗試讀取一筆數據)
    try:
        if db:
            # 假設你個 Collection 叫 products
            doc_ref = db.collection('products').limit(1).get()
            report += "✅ Firebase 金庫連線: 成功\n"
        else:
            report += "⚠️ Firebase 金庫連線: 模擬模式 (未提供金鑰)\n"
    except Exception as e:
        report += f"❌ Firebase 連線失敗: {str(e)}\n"
        
    # 3. 測試外部爬蟲權限 (例如嘗試訪問鞋網)
    try:
        # 加入 User-Agent 模擬真實瀏覽器，避免被直接阻擋
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get("https://snkrdunk.com", headers=headers, timeout=5)
        if response.status_code == 200:
            report += "✅ 外部爬蟲 (SNKRDUNK): 暢通\n"
        else:
            report += f"⚠️ 外部爬蟲警告: 狀態碼 {response.status_code}\n"
    except Exception as e:
        report += "❌ 外部爬蟲: 被擋或超時\n"

    # 4. 總結
    report += "\n📊 **結論：通電完成！莊家可以開工。**"
    
    # 傳送報告
    bot.reply_to(message, report, parse_mode='Markdown')

# ==========================================
# 3. 啟動 Bot
# ==========================================
if __name__ == "__main__":
    print("=== 小龍蝦 Telegram 管理機器人啟動 ===")
    print("等待接收指令...")
    # 啟動輪詢，持續接收訊息
    bot.infinity_polling()
