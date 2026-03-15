from pymongo import MongoClient

MONGO_URI = 

client = MongoClient(MONGO_URI)

db = client["chatgpt_app"]

collection = db["messages"]

print("Connected successfully")

for doc in collection.find().limit(5):
    print(doc)

