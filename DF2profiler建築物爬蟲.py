import firebase_admin
from firebase_admin import credentials, firestore
import requests
from bs4 import BeautifulSoup

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

  for td in td_elements:
    x_raw = td.get("data-xcoord")
    y_raw = td.get("data-ycoord")

    # 注意：網頁屬性名稱通常為 data-building (單數) 或 data-buildings (複數)
    b_raw = td.get("data-building") or td.get("data-buildings") or ""

    if x_raw and y_raw:
      try:
        x_val = int(x_raw)
        y_val = int(y_raw)
      except ValueError:
        continue

      # 將逗號分隔的建築字串轉為 List
      b_list = [b.strip() for b in b_raw.split(",") if b.strip()]

      formatted_map_data.append({"x": x_val, "y": y_val, "buildings": b_list})

  print(f"成功解析 {len(formatted_map_data)} 格地圖資料。")
  return formatted_map_data


# 1. 抓取地圖資料
建築資料 = parse_df2_map()

# 檢查一下抓出來的範例資料（確認 buildings 不是空的）
for sample in 建築資料[:5]:
  if sample["buildings"]:
    print(f"範例資料: 座標({sample['x']},{sample['y']}) -> {sample['buildings']}")

# 2. Firebase 初始化與上傳
if not firebase_admin._apps:
  cred = credentials.Certificate("serviceAccountKey.json")
  firebase_admin.initialize_app(cred)

db = firestore.client()


def delete_collection(coll_ref, batch_size):
  while True:
    docs = list(coll_ref.limit(batch_size).stream())
    if not docs:
      break
    batch = db.batch()
    for doc in docs:
      batch.delete(doc.reference)
    batch.commit()


map_ref = db.collection("map")
print("🗑️ 正在清空舊地圖資料...")
delete_collection(map_ref, 500)

print("🚀 正在上傳最新地圖資料...")
batch = db.batch()
count = 0

for item in 建築資料:
  # 使用 x_y 當作 Document ID，方便未來比對或單筆更新
  doc_id = f"{item['x']}_{item['y']}"
  doc_ref = map_ref.document(doc_id)

  batch.set(doc_ref, item)
  count += 1

  if count % 500 == 0:
    batch.commit()
    batch = db.batch()

if count % 500 != 0:
  batch.commit()

print(f"🎉 地圖資料更新完成！共上傳 {count} 筆。")