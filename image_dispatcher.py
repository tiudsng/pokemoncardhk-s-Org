import os
import random
import io
import hashlib
from PIL import Image, ImageEnhance
# import firebase_admin
# from firebase_admin import credentials, firestore, storage

# ==========================================
# 1. Firebase 初始化 (Firebase Init)
# ==========================================
def init_firebase():
    """初始化 Firebase Admin SDK (請確保有 serviceAccountKey.json)"""
    # cred = credentials.Certificate("serviceAccountKey.json")
    # firebase_admin.initialize_app(cred, {
    #     'storageBucket': 'your-project-id.appspot.com'
    # })
    # return firestore.client(), storage.bucket()
    print("[Firebase] 模擬初始化 (未連接真實資料庫)")
    return None, None

# db, bucket = init_firebase()

# ==========================================
# 2. 圖片去重與混淆處理 (Image Obfuscation)
# ==========================================
def obfuscate_image(image_bytes: bytes) -> bytes:
    """
    對圖片進行微小的隨機處理 (旋轉、亮度調整)，
    以改變其 MD5 Hash，防止平台偵測重複圖片。
    """
    try:
        # 讀取圖片
        img = Image.open(io.BytesIO(image_bytes))
        
        # 1. 隨機微小旋轉 (-0.5 到 0.5 度)
        angle = random.uniform(-0.5, 0.5)
        # 使用 resample=Image.BICUBIC 保持畫質，expand=False 保持原尺寸
        img = img.rotate(angle, resample=Image.BICUBIC, expand=False, fillcolor=(255,255,255))
        
        # 2. 隨機微調亮度 (0.99 到 1.01)
        enhancer = ImageEnhance.Brightness(img)
        factor = random.uniform(0.99, 1.01)
        img = enhancer.enhance(factor)
        
        # 3. 隨機微調對比度 (0.99 到 1.01)
        enhancer_contrast = ImageEnhance.Contrast(img)
        factor_contrast = random.uniform(0.99, 1.01)
        img = enhancer_contrast.enhance(factor_contrast)

        # 將處理後的圖片轉回 bytes
        output_io = io.BytesIO()
        # 根據原圖格式儲存，預設為 JPEG
        img_format = img.format if img.format else 'JPEG'
        # 稍微調整 quality 也可以改變 hash
        quality = random.randint(93, 97)
        img.save(output_io, format=img_format, quality=quality)
        
        new_bytes = output_io.getvalue()
        
        # 驗證 Hash 是否改變 (僅供測試觀察)
        old_hash = hashlib.md5(image_bytes).hexdigest()
        new_hash = hashlib.md5(new_bytes).hexdigest()
        print(f"[Obfuscation] 圖片已混淆. Hash 變化: {old_hash[:8]}... -> {new_hash[:8]}...")
        
        return new_bytes
    except Exception as e:
        print(f"[Error] 圖片混淆處理失敗: {e}")
        return image_bytes # 失敗則返回原圖

# ==========================================
# 3. 核心派相邏輯 (Image Dispatcher)
# ==========================================
# @firestore.transactional
def get_unique_image_transaction(transaction, db_client, uid: str, card_id: str, style_tier: str):
    """
    Firestore Transaction: 原子性地獲取未使用的圖片並標記為已使用。
    """
    # 查詢未使用的指定風格圖片
    query = db_client.collection('image_library') \
                     .where('card_id', '==', card_id) \
                     .where('style_tier', '==', style_tier) \
                     .where('is_used', '==', False) \
                     .limit(1)
    
    # 在 Transaction 中執行查詢
    docs = list(transaction.get(query))
    
    if not docs:
        return None
    
    doc = docs[0]
    doc_ref = db_client.collection('image_library').document(doc.id)
    
    # 讀取圖片資料
    image_data = doc.to_dict()
    
    # 原子性更新狀態
    transaction.update(doc_ref, {
        'is_used': True,
        'last_assigned_to': uid,
        'assigned_at': firestore.SERVER_TIMESTAMP
    })
    
    return image_data

def get_unique_image_for_post(uid: str, card_id: str, action: str, db_client=None, storage_bucket=None) -> dict:
    """
    為 AI Agent 上架分配獨一無二的圖片。
    """
    print(f"\n--- 開始派相 | UID: {uid} | Card: {card_id} | Action: {action.upper()} ---")
    
    try:
        # 1. 獲取用戶等級 (模擬)
        # if db_client:
        #     user_doc = db_client.collection('users').document(uid).get()
        #     user_tier = user_doc.to_dict().get('identity_tier', 'bronze')
        # else:
        user_tier = "gold" if "001" in uid else "silver" # 模擬邏輯
        print(f"[User] 判定用戶等級為: {user_tier.upper()}")

        # 2. 決定需要的圖片風格
        target_style = "raw"
        if action == "buy":
            target_style = "official" # 徵卡一律用官方高清圖
            print("[Rule] 徵卡 (Buy) 模式: 強制使用 Official 高清圖")
        elif action == "sell":
            if user_tier == "gold":
                target_style = "premium" # Gold 用戶優先用鑑定盒/專業實拍
                print("[Rule] 賣卡 (Sell) + Gold 用戶: 優先使用 Premium 鑑定圖")
            else:
                target_style = "raw" # Silver/Bronze 用戶用素人實拍
                print("[Rule] 賣卡 (Sell) + 一般用戶: 使用 Raw 素人實拍圖")

        # 3. 執行 Transaction 獲取圖片 (模擬)
        image_data = None
        # if db_client:
        #     transaction = db_client.transaction()
        #     image_data = get_unique_image_transaction(transaction, db_client, uid, card_id, target_style)
        # else:
        # 模擬成功獲取圖片
        image_data = {
            "iid": "mock_img_777",
            "url": f"https://mock-storage.com/{card_id}_{target_style}.jpg",
            "style_tier": target_style,
            "storage_path": f"image_library/{card_id}/{target_style}/mock_img_777.jpg"
        }
        print(f"[DB] 成功鎖定圖片: {image_data['iid']} (Style: {target_style})")

        if not image_data:
            print(f"[Warning] 找不到符合條件的未使用圖片 (Card: {card_id}, Style: {target_style})")
            return None

        # 4. 圖片混淆處理 (僅限賣卡實拍圖)
        final_url = image_data['url']
        
        if action == "sell" and target_style in ["raw", "premium"]:
            print("[Process] 準備進行圖片混淆去重處理...")
            
            # 模擬從 Storage 下載圖片 (這裡用一張純色圖片代替)
            # if storage_bucket:
            #     blob = storage_bucket.blob(image_data['storage_path'])
            #     image_bytes = blob.download_as_bytes()
            # else:
            # 生成一張測試用的圖片 bytes
            test_img = Image.new('RGB', (400, 600), color=(73, 109, 137))
            img_byte_arr = io.BytesIO()
            test_img.save(img_byte_arr, format='JPEG')
            image_bytes = img_byte_arr.getvalue()

            # 執行混淆
            obfuscated_bytes = obfuscate_image(image_bytes)

            # 將混淆後的圖片重新上傳 (覆蓋原圖或存為新版本)
            # if storage_bucket:
            #     obfuscated_path = f"image_library/{card_id}/{target_style}/{image_data['iid']}_obf.jpg"
            #     blob_obf = storage_bucket.blob(obfuscated_path)
            #     blob_obf.upload_from_string(obfuscated_bytes, content_type='image/jpeg')
            #     blob_obf.make_public()
            #     final_url = blob_obf.public_url
            #     print(f"[Storage] 混淆圖片已上傳: {final_url}")
            # else:
            final_url = f"https://mock-storage.com/{card_id}_{target_style}_obf.jpg"
            print(f"[Storage] 模擬上傳混淆圖片: {final_url}")

        print(f"[Success] 派相完成！最終圖片 URL: {final_url}")
        
        return {
            "url": final_url,
            "style_tier": image_data['style_tier'],
            "iid": image_data['iid']
        }

    except Exception as e:
        print(f"[Error] 派相過程發生嚴重錯誤: {e}")
        return None

# ==========================================
# 測試執行 (Testing)
# ==========================================
if __name__ == "__main__":
    print("=== TCG INVEST AI 派相系統測試 ===")
    
    # 測試 1: Gold 用戶賣卡 (應分配 Premium 圖並混淆)
    get_unique_image_for_post(uid="user_001_gold", card_id="s12a_110", action="sell")
    
    # 測試 2: Silver 用戶賣卡 (應分配 Raw 圖並混淆)
    get_unique_image_for_post(uid="user_002_silver", card_id="s12a_110", action="sell")
    
    # 測試 3: 任何用戶徵卡 (應分配 Official 圖，不混淆)
    get_unique_image_for_post(uid="user_003_bronze", card_id="s12a_110", action="buy")
