import firebase_admin
from firebase_admin import credentials, firestore
import requests
from bs4 import BeautifulSoup

# ==================================================
# 1. 爬蟲與資料處理邏輯
# ==================================================
URL = "https://df2profiler.com/gamemap/?sirius"
res = requests.get(URL)
soup = BeautifulSoup(res.text, "lxml")

# 不包含主線任務
quest = soup("span", {"data-forever": "0"}, {"data-daily": "0"})


# 根據 quest 類型抓取不同建築及城市
def get_parameters(task_type):
  parameter_mapping = {
      "Blood Sample*4": (mission_building, mission_city),
      "Blood Sample*5": (mission_building, mission_city),
      "Blood Sample*6": (mission_building, mission_city),
      "HR": (mission_building, mission_city),
      "Find Person Live": (mission_building, mission_city),
      "Find Person Dead": (mission_building, mission_city),
      "Find Item": (mission_building, mission_city),
      "Exterminate": (mission_building, mission_city),
      "Kill Boss": (giver_building, giver_city),
      "Give Item": (giver_building, giver_city),
      "SM": (giver_building, giver_city),
      "Purple Zone": (giver_building, giver_city),
      "Loot Search": (giver_building, giver_city),
      "Complete Missions": (giver_building, giver_city),
      "Clear Escape": (giver_building, giver_city),
  }
  return parameter_mapping.get(task_type, (None, None))


# 替換字符
def clean_text(text, replacements):
  for old, new in replacements:
    text = text.replace(old, new)
  return text


# 辨識任務類型
def get_task_type(mission_text):
  task_mapping = {
      "Blood Sample x4": "Blood Sample*4",
      "Blood Sample x5": "Blood Sample*5",
      "Blood Sample x6": "Blood Sample*6",
      "Human Remains": "HR",
      "Escape Stalker": "SM",
      "Challenges": "Purple Zone",
      "Loot Buildings": "Loot Search",
      "Complete Mission": "Complete Missions",
      "Clear Escape": "Clear Escape",
      "Exterminate": "Exterminate",
      "Creep": "Kill Boss",
      "Mother": "Kill Boss",
      "Choir": "Kill Boss",
      "Tendril": "Kill Boss",
      "Titan": "Kill Boss",
      "Hysteric": "Kill Boss",
      "Twin": "Kill Boss",
      "Finger Head": "Kill Boss",
      "Reaper": "Kill Boss",
      "Kill Boss ": "Kill Boss",
      "Locate / Contact Person": "Find Person Live",
      "Credit Card": "Find Person Dead",
      "Name Tag": "Find Person Dead",
      "ID Card": "Find Person Dead",
      "Wallet": "Find Person Dead",
      "Necklace": "Find Item",
      "Pendant": "Find Item",
      "Formula Milk": "Find Item",
      "Ring": "Find Item",
      "Wedding Ring": "Find Item",
      "Engagement Ring": "Find Item",
      "Inhaler": "Find Item",
      "Insulin": "Find Item",
      "Allergy Tablets": "Find Item",
      "Anti Depressants": "Find Item",
      "Wrist Watch": "Find Item",
      "Broach": "Find Item",
      "Burns Kit": "Give Item",
      "Bandages": "Give Item",
      "Iodine Tablets": "Give Item",
      "Painkillers": "Give Item",
      "Antibiotic": "Give Item",
      "Champagne": "Give Item",
      "Foie Gras": "Give Item",
      "Single Malt Scotch": "Give Item",
      "White Truffles": "Give Item",
      "Beluga Caviar": "Give Item",
      "Vintage Wine": "Give Item",
      "Water": "Give Item",
      "Tires": "Give Item",
      "Exhaust": "Give Item",
      "Fuel Injector": "Give Item",
      "Roof Box": "Give Item",
      "Cylinder Heads": "Give Item",
      "MAC-11": "Give Item",
      "Lock-17": "Give Item",
      "Enfield": "Give Item",
      "M14": "Give Item",
      "Beta C4": "Give Item",
      "Mannberg 500": "Give Item",
      "CZ-83": "Give Item",
      "Greening GLR": "Give Item",
      "Mannberg 590M": "Give Item",
      "Redfield Sitori": "Give Item",
      "Webster 1942": "Give Item",
      ".32 ACP": "Give Item",
      "20 G": "Give Item",
      "12 G": "Give Item",
      "10 G": "Give Item",
      "5.56mm": "Give Item",
      "7.62mm": "Give Item",
      "9mm": "Give Item",
      "8mm Rifle": "Give Item",
      ".38 Special": "Give Item",
      ".45 Kolt": "Give Item",
      ".40 SW": "Give Item",
      ".357 Magnum": "Give Item",
  }
  for key in task_mapping:
    if key in mission_text:
      return task_mapping[key]
  return "Unknown Task"


results = []
replacements = [
    ("RavenwallHeights", "Ravenwall Heights"),
    ("AlbandalePark", "Albandale Park"),
    ("RichbowHunt", "Richbow Hunt"),
    ("WestMoledale", "West Moledale"),
    ("SouthMoorhurst", "South Moorhurst"),
    ("&#039;", "'"),
]

for mission in quest:
  giver_city_elem = mission.find("strong")
  if giver_city_elem and giver_city_elem.find_next("span"):
    giver_city = clean_text(
        giver_city_elem.find_next("span").get("data-district", ""), replacements
    )
    giver_building = clean_text(
        giver_city_elem.find_next("span").get("data-building", ""), replacements
    )
  else:
    giver_city, giver_building = "", ""

  mission_city = mission.get("data-district")
  if mission_city is not None:
    mission_city = clean_text(mission_city, replacements)

  mission_building = mission.get("data-building")
  if mission_building is not None:
    mission_building = clean_text(mission_building, replacements)

  task_type = get_task_type(mission.text)
  building, city = get_parameters(task_type)

  if building and city and building not in [
      "Greywood Star Hotel",
      "Haverbrook Memorial Hospital",
      "Dallbow Police Department",
      "Rivera's Hideout",
      "Fright's Mansion",
  ]:
    results.append(
        {"building": building, "city": city, "task_type": task_type}
    )

print(f"爬蟲完成，共抓取到 {len(results)} 筆任務資料。")


import firebase_admin
from firebase_admin import credentials, firestore

# ==================================================
# Firebase 初始化
# ==================================================
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()
COLLECTION_NAME = "task"

# ==================================================
# 1. 刪除 Collection 裡面的舊文件 (Batch Delete)
# ==================================================
print(f"正在清空 '{COLLECTION_NAME}' 集合中的舊資料...")

collection_ref = db.collection(COLLECTION_NAME)

while True:
  # 每次抓取最多 500 筆文件進行刪除 (Firestore 單次 batch 上限為 500)
  docs = list(collection_ref.limit(500).stream())

  if not docs:
    break

  delete_batch = db.batch()
  for doc in docs:
    delete_batch.delete(doc.reference)

  delete_batch.commit()
  print(f"已清理 {len(docs)} 筆舊資料...")

print("舊資料清理完成！\n")

# ==================================================
# 2. 上傳新爬到的資料 (Batch Write)
# ==================================================
print(f"開始上傳新的 {len(results)} 筆爬蟲資料...")

write_batch = db.batch()
count = 0

for item in results:
  # 加入伺服器時間戳記
  item["updated_at"] = firestore.SERVER_TIMESTAMP

  # 自動生成 Document ID 並加入批次寫入
  doc_ref = collection_ref.document()
  write_batch.set(doc_ref, item)

  count += 1

  # 每 500 筆分批 commit 一次
  if count % 500 == 0:
    write_batch.commit()
    write_batch = db.batch()

# 寫入剩餘未滿 500 筆的資料
if count % 500 != 0:
  write_batch.commit()

print(f"全部完成！成功刪除舊資料，並上傳 {count} 筆新資料至 Firestore。")