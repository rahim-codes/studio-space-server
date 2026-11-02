import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db("studio-space");
    const studioCollection = database.collection("studio");

    app.get("/", (req, res) => {
      res.send("Express & Native MongoDB Atlas Server is running! 🚀");
    });

    // app.post('/users', async (req, res) => {
    //   try {
    //     const newUser = req.body;
    //     const result = await userCollection.insertOne(newUser);
    //     res.status(201).json({ success: true, insertedId: result.insertedId });
    //   } catch (error) {
    //     res.status(500).json({ success: false, error: error.message });
    //   }
    // });

    app.get("/studios", async (req, res) => {
      const data = req.body;
      try {
        const studios = await studioCollection.find(data).toArray();
        res.status(200).json({ success: true, data: studios });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    console.log("✅ Successfully connected to MongoDB Atlas!");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
  }
}

run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`🌍 Server is running on port ${PORT}`);
});
