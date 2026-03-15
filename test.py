from pymongo import MongoClient

# Password must NOT be in angle brackets - use the raw password only (no < or >)
MONGO_URI = "mongodb+srv://varunsingh2191:singhisking003@cluster0.ixt0lag.mongodb.net/?appName=Cluster0"

client = MongoClient(MONGO_URI)

db = client["chatgpt_app"]

collection = db["messages"]

print("Connected successfully")

for doc in collection.find().limit(5):
    print(docs)

