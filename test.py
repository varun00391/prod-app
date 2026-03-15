# from pymongo import MongoClient

# # Password must NOT be in angle brackets - use the raw password only (no < or >)
# MONGO_URI = "mongodb+srv://varunsingh2191:singhisking003@cluster0.ixt0lag.mongodb.net/?appName=Cluster0"

# client = MongoClient(MONGO_URI)

# db = client["chatgpt_app"]

# collection = db["messages"]

# print("Connected successfully")

# for doc in collection.find().limit(5):
#     print(docs)


from pymongo import MongoClient

MONGO_URI = "mongodb+srv://varunsingh2191:singhisking003@cluster0.ixt0lag.mongodb.net/?appName=Cluster0"

client = MongoClient(MONGO_URI)

print("Connected successfully")

# List databases before
print("\nDatabases (before):")
print(client.list_database_names())

# Create chatgpt_app database (MongoDB creates DB on first write)
db = client["chatgpt_app"]
# Touch collections the app uses so DB and collections exist
for coll_name in ["users", "conversations", "messages"]:
    coll = db[coll_name]
    # Insert a placeholder doc and remove it so the collection exists but is empty
    coll.insert_one({"_init": True})
    coll.delete_one({"_init": True})

print("\nCreated database 'chatgpt_app' with collections: users, conversations, messages")

# List databases after
print("\nDatabases (after):")
print(client.list_database_names())
print("\nCollections in chatgpt_app:", db.list_collection_names())
