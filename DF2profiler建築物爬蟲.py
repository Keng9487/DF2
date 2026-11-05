import requests
from bs4 import BeautifulSoup

# ==================================================
# Supabase 設定 (請填入您的專案資訊)
# ==================================================
SUPABASE_URL = "https://yasnbvmngdxkukuxvafc.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc25idm1uZ2R4a3VrdXh2YWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjgyNzQzNSwiZXhwIjoyMTAyNDAzNDM1fQ.J8_-wob0tQWyoaTMOV5pMtFDBVJC6SDXw_KT4YOcb1A"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

URL = "https://df2profiler.com/gamemap/?sirius"


def parse_df2_map():
    print(f"正在請求網頁：{URL}")
    response = requests.get(URL)

    if response.status_code != 200:
        print(f"連線失敗，HTTP 狀態碼：{response.status_code}")
        return []

    soup = BeautifulSoup(response.text, "html.parser")

    # 尋找所有包含地圖座標的 <td> 標籤
    td_elements = soup.select("td[data-xcoord]")
    formatted_map_data = []
    replacements = [
        ("RavenwallHeights", "拉文沃爾高地"),
        ("AlbandalePark", "阿班達爾公園"),
        ("Overwood","木上村"),
        ("Greywood","灰木鎮"),
        ("Lerwillbury","勒威伯里"),
        ("Dallbow","達爾博"),
        ("Coopertown","庫珀鎮"),
        ("RichbowHunt", "豐弓鎮狩獵區"),
        ("Duntsville","丹茨維爾鎮"),
        ("Archbrook","阿奇布魯克"),
        ("WestMoledale", "西莫代爾"),
        ("Dawnhill","黎明丘"),
        ("Haverbrook","哈弗布魯克"),
        ("SouthMoorhurst", "南摩赫斯特"),
        ("Wolfstable","狼堡"),
        ("&#039;", "'")
    ]

    replacements_for_b = [
        ('Greywood Star Hotel', '灰木之星旅館'),
        ('Haverbrook Memorial Hospital', '哈弗布魯克紀念醫院'),
        ('Dallbow Police Department', '達爾博警察局'),
        ('Ravenwall Heights', '拉文沃爾高地'),
        ('Albandale Park', '阿班達爾公園'),
        ('Overwood', '木上村'),
        ('Greywood', '灰木鎮'),
        ('Lerwillbury', '勒威伯里'),
        ('Dallbow', '達爾博'),
        ('Coopertown', '庫珀鎮'),
        ('Richbow Hunt', '豐弓鎮狩獵區'),
        ('Duntsville', '丹茨維爾鎮'),
        ('Archbrook', '阿奇布魯克'),
        ('West Moledale', '西莫代爾'),
        ('Dawnhill', '黎明丘'),
        ('Haverbrook', '哈弗布魯克'),
        ('South Moorhurst', '南摩赫斯特'),
        ('Wolfstable', '狼堡')
    ]
    

    for td in td_elements:
        x_raw = td.get("data-xcoord")
        y_raw = td.get("data-ycoord")

        # 網頁屬性名稱通常為 data-building (單數) 或 data-buildings (複數)
        b_raw = td.get("data-buildings") or ""
        d_raw = td.get("data-district") or ""


        if x_raw and y_raw:
            try:
                x_val = int(x_raw)
                y_val = int(y_raw)
            except ValueError:
                continue

            # 1. 先把逗號分隔的建築字串轉為 List（只在迴圈外做一次）
            b_list = [b.strip() for b in b_raw.split(",")] if b_raw else []

            # 2. 針對清單中的每一個建築名稱，套用所有的替換規則
            b_list_cleaned = []
            for b in b_list:
                current_b = b
                for old_str, new_str in replacements_for_b:
                    current_b = current_b.replace(old_str, new_str)
                b_list_cleaned.append(current_b)
            d_list = d_raw
            for old_str, new_str in replacements:
                d_list = d_list.replace(old_str, new_str)

            # 配合 Supabase map 表結構：id (文字主鍵) 與 buildings (jsonb)
            zone_id = f"{x_val}_{y_val}"
            formatted_map_data.append({
                "id": zone_id,          # 對應資料庫的 id 欄位
                "buildings": b_list_cleaned,   # 對應資料庫的 buildings 欄位
                "x":x_val,
                "y":y_val,
                "district":d_list
            })

    print(f"成功解析 {len(formatted_map_data)} 格地圖資料。")
    return formatted_map_data


# 1. 抓取地圖資料
建築資料 = parse_df2_map()

# 檢查一下抓出來的範例資料
for sample in 建築資料[:5]:
    if sample["buildings"]:
        print(f"範例資料: 座標({sample['id']}) -> {sample['buildings']}")

# ==================================================
# 2. Supabase 資料同步
# ==================================================
# B. 批次上傳新資料 (分批每 500 筆為一批次，避免請求過大)
print("🚀 正在上傳最新地圖資料至 Supabase...")

# 設定 upsert 標頭：當 id 重複時自動覆蓋更新
headers_upsert = HEADERS.copy()
headers_upsert["Prefer"] = "resolution=merge-duplicates"

batch_size = 500
total_count = len(建築資料)

for i in range(0, total_count, batch_size):
    chunk = 建築資料[i:i + batch_size]
    
    # 修正：將 URL 指向正確的 "map" 表
    res = requests.post(
        f"{SUPABASE_URL}/rest/v1/map",
        headers=headers_upsert,
        json=chunk
    )
    
    if res.status_code in [200, 201]:
        print(f"已成功上傳批次：{i} ~ {min(i + batch_size, total_count)} / {total_count}")
    else:
        print(f"批次上傳失敗 ({i}):", res.text)

print(f"🎉 地圖資料更新完成！共處理 {total_count} 筆。")