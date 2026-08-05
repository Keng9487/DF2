import requests
from bs4 import BeautifulSoup
import re
import csv
import json

URL = "https://df2profiler.com/gamemap/?sirius"
res = requests.get(URL)
soup = BeautifulSoup(res.text,'lxml')
# 不包含主線
quest = soup("span",{'data-forever':'0'},{'data-daily':'0'})

#根據quest類型抓取不同建築及城市
def get_parameters(task_type):
  parameter_mapping = {
      "Blood Sample*4":(mission_building, mission_city),
      "Blood Sample*5":(mission_building, mission_city),
      "Blood Sample*6":(mission_building, mission_city),
      "HR":(mission_building, mission_city),
      "Find Person Live":(mission_building, mission_city),
      "Find Person Dead":(mission_building, mission_city),
      "Find Item":(mission_building, mission_city),
      "Exterminate":(mission_building, mission_city),
      "Kill Boss":(giver_building, giver_city),
      "Kill Boss":(giver_building, giver_city),
      "Give Item":(giver_building,giver_city),
      "SM":(giver_building,giver_city),
      "Purple Zone":(giver_building,giver_city),
      "Loot Search":(giver_building,giver_city),
      "Complete Missions":(giver_building,giver_city),
      "Clear Escape":(giver_building,giver_city)
  }
  return parameter_mapping.get(task_type,(None, None))  # 預設回傳 (None, None)

#替換字符
def clean_text(text, replacements):
  for old, new in replacements:
        text = text.replace(old, new)
  return text

#替換字符
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
        "Creep":"Kill Boss",
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
        "MAC-11":"Give Item",
        "Lock-17":"Give Item",
        "Enfield":"Give Item",
        "M14":"Give Item",
        "Beta C4":"Give Item",
        "Mannberg 500":"Give Item",
        "CZ-83":"Give Item",
        "Greening GLR":"Give Item",
        "Mannberg 590M":"Give Item",
        "Redfield Sitori":"Give Item",
        "Webster 1942":"Give Item",
        ".32 ACP":"Give Item",
        "20 G":"Give Item",
        "12 G":"Give Item",
        "10 G":"Give Item",
        "5.56mm":"Give Item",
        "7.62mm":"Give Item",
        "9mm":"Give Item",
        "8mm Rifle":"Give Item",
        ".38 Special":"Give Item",
        ".45 Kolt":"Give Item",
        ".40 SW":"Give Item",
        ".357 Magnum":"Give Item"
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
    ("&#039;", "'")
]
for mission in quest:
  # 接取任務城市
  giver_city = clean_text(mission.find("strong").find_next('span').get('data-district'),replacements)
  # 接取任務建築
  giver_building = clean_text(mission.find("strong").find_next('span').get('data-building'),replacements)
  # 任務城市
  mission_city = mission.get('data-district')
  if mission_city != None:
    mission_city = clean_text(mission_city,replacements)
  # 任務建築
  mission_building = mission.get('data-building')
  if mission_building != None:
    mission_building = clean_text(mission_building,replacements)
  # 根據任務內容判斷任務類型
  task_type = get_task_type(mission.text)
  building, city = get_parameters(task_type)

  if building and city and building not in ["Greywood Star Hotel","Haverbrook Memorial Hospital","Dallbow Police Department","Rivera's Hideout","Fright's Mansion"]:
    results.append({
        "building": building,
        "city": city,
        "task_type": task_type
    })

import firebase_admin
from firebase_admin import credentials, firestore

# 1. 初始化連線（使用你的 serviceAccountKey.json 金鑰）
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

# 2. 連線到 Firestore 資料庫
db = firestore.client()


def delete_collection(coll_ref, batch_size):
  """遞迴清空整個 Firestore 集合的函式"""
  docs = list(coll_ref.limit(batch_size).stream())
  deleted = 0

  for doc in docs:
    doc.reference.delete()
    deleted += 1

  if deleted >= batch_size:
    return delete_collection(coll_ref, batch_size)


def update_all_quests(new_data_list):
  collection_ref = db.collection("quests")

  print("🗑️ 正在清空 Firestore 中的舊任務資料...")
  delete_collection(collection_ref, batch_size=500)
  print("✅ 舊資料已全部清除！")

  print("🚀 開始上傳最新爬蟲資料...")
  batch = db.batch()
  count = 0

  for item in new_data_list:
    doc_ref = collection_ref.document()
    batch.set(doc_ref, item)
    count += 1

    # Firestore 批次寫入一次最多 500 筆
    if count % 500 == 0:
      batch.commit()
      batch = db.batch()
      print(f"已上傳 {count} 筆...")

  # 提交剩餘的資料
  batch.commit()
  print(f"🎉 全部更新完成！總共寫入 {count} 筆最新資料。")


if __name__ == "__main__":
  update_all_quests(results)