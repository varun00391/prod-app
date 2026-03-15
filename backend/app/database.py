from pymongo import MongoClient
from app.config import settings

client = MongoClient(settings.mongodb_uri)
db = client[settings.mongodb_db]

users_collection = db["users"]
conversations_collection = db["conversations"]
messages_collection = db["messages"]
