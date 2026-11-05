from datetime import datetime
from bs4 import BeautifulSoup
import requests
from supabase import Client, create_client

# ==================================================
# Supabase 初始化設定
# ==================================================
SUPABASE_URL = "https://yasnbvmngdxkukuxvafc.supabase.co"  # 你的 Supabase 專案網址
SUPABASE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc25idm1uZ2R4a3VrdXh2YWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjgyNzQzNSwiZXhwIjoyMTAyNDAzNDM1fQ.J8_-wob0tQWyoaTMOV5pMtFDBVJC6SDXw_KT4YOcb1A"  # 建議使用 service_role key 以擁有完整讀寫權限
)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
TABLE_NAME = "tasks"  # 對應 Supabase 中的資料表名稱

# ==================================================
# 1. 爬蟲與資料處理邏輯
# ==================================================
URL = "https://df2profiler.com/gamemap/?sirius"
res = requests.get(URL)
soup = BeautifulSoup(res.text, "html.parser")

# 不包含主線任務
quest = soup.find_all("span",{"data-forever":"0","data-daily":"0"})

# 替換字符
def clean_text(text, replacements):
  for old, new in replacements:
    text = text.replace(old, new)
  return text


# 辨識任務類型
def get_task_type(mission_text):
  task_mapping = {
      "Blood Sample x4": "血液樣本*4",
      "Blood Sample x5": "血液樣本*5",
      "Blood Sample x6": "血液樣本*6",
      "Human Remains": "人類遺骸",
      "Escape Stalker": "追靈者",
      "Challenges": "完成紫區",
      "Loot Buildings": "搜索物資",
      "Complete Mission": "完成任務",
      "Clear Escape": "逃出",
      "Exterminate": "殲滅",
      "Creep": "擊殺頭目",
      "Mother": "擊殺頭目",
      "Choir": "擊殺頭目",
      "Tendril": "擊殺頭目",
      "Titan": "擊殺頭目",
      "Hysteric": "擊殺頭目",
      "Twin": "擊殺頭目",
      "Finger Head": "擊殺頭目",
      "Reaper": "擊殺頭目",
      "Kill Boss ": "擊殺頭目",
      "Locate / Contact Person": "尋找活人",
      "Credit Card": "尋找死人",
      "Name Tag": "尋找死人",
      "ID Card": "尋找死人",
      "Wallet": "尋找死人",
      "Necklace": "尋找物品",
      "Pendant": "尋找物品",
      "Formula Milk": "尋找物品",
      "Ring": "尋找物品",
      "Wedding Ring": "尋找物品",
      "Engagement Ring": "尋找物品",
      "Inhaler": "尋找物品",
      "Insulin": "尋找物品",
      "Allergy Tablets": "尋找物品",
      "Anti Depressants": "尋找物品",
      "Wrist Watch": "尋找物品",
      "Broach": "尋找物品",
      "Burns Kit": "給東西",
      "Bandages": "給東西",
      "Iodine Tablets": "給東西",
      "Painkillers": "給東西",
      "Antibiotic": "給東西",
      "Champagne": "給東西",
      "Foie Gras": "給東西",
      "Single Malt Scotch": "給東西",
      "White Truffles": "給東西",
      "Beluga Caviar": "給東西",
      "Vintage Wine": "給東西",
      "Water": "給東西",
      "Tires": "給東西",
      "Exhaust": "給東西",
      "Fuel Injector": "給東西",
      "Roof Box": "給東西",
      "Cylinder Heads": "給東西",
      "MAC-11": "給東西",
      "Lock-17": "給東西",
      "Enfield": "給東西",
      "M14": "給東西",
      "Beta C4": "給東西",
      "Mannberg 500": "給東西",
      "CZ-83": "給東西",
      "Greening GLR": "給東西",
      "Mannberg 590M": "給東西",
      "Redfield Sitori": "給東西",
      "Webster 1942": "給東西",
      ".32 ACP": "給東西",
      "20 G": "給東西",
      "12 G": "給東西",
      "10 G": "給東西",
      "5.56mm": "給東西",
      "7.62mm": "給東西",
      "9mm": "給東西",
      "8mm Rifle": "給東西",
      ".38 Special": "給東西",
      ".45 Kolt": "給東西",
      ".40 SW": "給東西",
      ".357 Magnum": "給東西",
  }
  for key in task_mapping:
    if key in mission_text:
      return task_mapping[key]
  return "Unknown Task"


results = []
replacements = [
    ('Greywood Star Hotel', '灰木之星旅館'),
    ('Haverbrook Memorial Hospital', '哈弗布魯克紀念醫院'),
    ('Dallbow Police Department', '達爾博警察局'),
    ('RavenwallHeights', '拉文沃爾高地'),
    ('AlbandalePark', '阿班達爾公園'),
    ('Overwood', '木上村'),
    ('Greywood', '灰木鎮'),
    ('Lerwillbury', '勒威伯里'),
    ('Dallbow', '達爾博'),
    ('Coopertown', '庫珀鎮'),
    ('RichbowHunt', '豐弓鎮狩獵區'),
    ('Duntsville', '丹茨維爾鎮'),
    ('Archbrook', '阿奇布魯克'),
    ('WestMoledale', '西莫代爾'),
    ('Dawnhill', '黎明丘'),
    ('Haverbrook', '哈弗布魯克'),
    ('SouthMoorhurst', '南摩赫斯特'),
    ('Wolfstable', '狼堡'),
    ("&#039;", "'")
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
    giver_x_value = int(giver_city_elem.find_next("span").get("data-xcoord",""))
    giver_y_value = int(giver_city_elem.find_next("span").get("data-ycoord",""))
  else:
    giver_city, giver_building,giver_x_value,giver_y_value = "", "","",""

  mission_city = mission.get("data-district")
  if mission_city is not None:
    mission_city = clean_text(mission_city, replacements)
  mission_building = mission.get("data-building")
  if mission_building is not None:
    mission_building = clean_text(mission_building, replacements)
  mission_x_value = mission.get("data-xcoord")
  if mission_x_value is not None:
    mission_x_value = int(mission.get("data-xcoord"))
  mission_y_value = mission.get("data-ycoord")
  if mission_y_value is not None:
    mission_y_value = int(mission.get("data-ycoord"))

  # 根據 quest 類型抓取不同建築及城市
  def get_parameters(task_type):
    parameter_mapping = {
        "血液樣本*4": (mission_building, mission_city,mission_x_value,mission_y_value),
        "血液樣本*5": (mission_building, mission_city,mission_x_value,mission_y_value),
        "血液樣本*6": (mission_building, mission_city,mission_x_value,mission_y_value),
        "人類遺骸": (mission_building, mission_city,mission_x_value,mission_y_value),
        "尋找活人": (mission_building, mission_city,mission_x_value,mission_y_value),
        "尋找死人": (mission_building, mission_city,mission_x_value,mission_y_value),
        "尋找物品": (mission_building, mission_city,mission_x_value,mission_y_value),
        "殲滅": (mission_building, mission_city,mission_x_value,mission_y_value),
        "擊殺頭目": (giver_building, giver_city,giver_x_value,giver_y_value),
        "給東西": (giver_building, giver_city,giver_x_value,giver_y_value),
        "追靈者": (giver_building, giver_city,giver_x_value,giver_y_value),
        "完成紫區": (giver_building, giver_city,giver_x_value,giver_y_value),
        "搜索物資": (giver_building, giver_city,giver_x_value,giver_y_value),
        "完成任務": (giver_building, giver_city,giver_x_value,giver_y_value),
        "逃出": (giver_building, giver_city,giver_x_value,giver_y_value)
    }
    return parameter_mapping.get(task_type, (None, None,None,None))


  task_type = get_task_type(mission.text)
  building, city ,x_value,y_value= get_parameters(task_type)

  if building and city and building not in [
      "灰木之星旅館",
      "哈弗布魯克紀念醫院",
      "達爾博警察局",
      "Rivera's Hideout",
      "Fright's Mansion",
  ]:
    results.append({
        "building": building,
        "city": city,
        "task_type": task_type,
        "x":x_value,
        "y":y_value,
        "created_at": datetime.now().isoformat(),
        "status":None
    })

print(f"爬蟲完成，共抓取到 {len(results)} 筆任務資料。")

# ==================================================
# 2. 清空 Supabase 表格中的舊資料
# ==================================================
print(f"正在清空 '{TABLE_NAME}' 表格中的舊資料...")

# 透過條件刪除整張表所有資料（利用不可能符合的篩選條件）
supabase.table(TABLE_NAME).delete().neq(
    "building", "___NON_EXISTENT___"
).execute()

print("舊資料清理完成！\n")

# ==================================================
# 3. 批次上傳新資料至 Supabase
# ==================================================
print(f"開始上傳新的 {len(results)} 筆爬蟲資料...")

batch_size = 500
total_inserted = 0

for i in range(0, len(results), batch_size):
  batch = results[i : i + batch_size]
  supabase.table(TABLE_NAME).insert(batch).execute()
  total_inserted += len(batch)
  print(f"已上傳 {total_inserted} / {len(results)} 筆資料...")

print(
    f"全部完成！成功清空舊資料，並上傳 {total_inserted} 筆新資料至 Supabase。"
)