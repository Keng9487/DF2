import requests
from bs4 import BeautifulSoup
import json

URL = "https://df2profiler.com/gamemap/?sirius"

def parse_df2_map():
    print(f"正在請求網頁：{URL}")
    response = requests.get(URL)
    
    if response.status_code != 200:
        print(f"連線失敗，HTTP 狀態碼：{response.status_code}")
        return []
    
    soup = BeautifulSoup(response.text, "html.parser")

    # 尋找所有包含 data-buildings 屬性的 <td> 標籤
    td_elements = soup.select(
        "td[data-buildings], td[data-xcoord], td[data-xcoord2]"
    )
    results = []
    for td in td_elements:
        x = td.get("data-xcoord")
        y = td.get("data-ycoord")
        buildings = td.get("data-buildings")
        if buildings or x:
            results.append(
                {
                    "data-xcoord": x,
                    "data-ycoord": y,
                    "data-buildings": buildings,
                }
            )
    # 假設你從網頁爬下來的原始資料是 raw_item
    # raw_item = {"data-xcoord": "6", "data-ycoord": "1", "data-buildings": "Haley Cottage"}

    formatted_map_data = []

    for item in results:
        # 1. 把字串座標轉成整數 (int)
        x_val = int(item.get("data-xcoord", 0))
        y_val = int(item.get("data-ycoord", 0))

        # 2. 把建築物字串轉成陣列 (List)，如果有多個建築可以用逗號split，或者直接包成單元素陣列
        b_raw = item.get("data-buildings", "")
        # 如果本來就是字串，把它轉成陣列格式 ["建築名稱"]
        b_list = [b.strip() for b in b_raw.split(",") if b.strip()]

        formatted_map_data.append(
            {"x": x_val, "y": y_val, "buildings": b_list}
        )
    return formatted_map_data
    # 接著再把 formatted_map_data 批次上傳到 Firebase 的 map 集合！

results = parse_df2_map()
import firebase_admin
from firebase_admin import credentials, firestore

# 初始化連線
if not firebase_admin._apps:
  cred = credentials.Certificate("serviceAccountKey.json")
  firebase_admin.initialize_app(cred)

db = firestore.client()


def delete_collection(coll_ref, batch_size):
  docs = list(coll_ref.limit(batch_size).stream())
  deleted = 0
  for doc in docs:
    doc.reference.delete()
    deleted += 1
  if deleted >= batch_size:
    return delete_collection(coll_ref, batch_size)

# 上傳到 map 集合
map_ref = db.collection("map")
print("🗑️ 正在清空舊地圖資料...")
delete_collection(map_ref, 500)

print("🚀 正在上傳最新地圖資料...")
batch = db.batch()
count = 0
for item in results:
  doc_ref = map_ref.document()
  batch.set(doc_ref, item)
  count += 1
  if count % 500 == 0:
    batch.commit()
    batch = db.batch()
batch.commit()
print(f"🎉 地圖資料更新完成！共 {count} 筆。")
