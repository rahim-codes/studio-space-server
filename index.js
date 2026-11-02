import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

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

    app.post("/studios", async (req, res) => {
      try {
        const newStudio = req.body;
        const result = await studioCollection.insertOne(newStudio);
        res.status(201).json({
          success: true,
          message: "Studio added successfully!",
          insertedId: result.insertedId,
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.get("/studios", async (req, res) => {
      const data = req.body;
      try {
        const studios = await studioCollection.find(data).toArray();
        res.status(200).json({ success: true, data: studios });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // 3. GET Single Studio Details by ID
    app.get("/studios/:id", async (req, res) => {
      try {
        const { id } = req.params;

        // MongoDB ObjectId validation
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid Studio ID format",
          });
        }

        const query = { _id: new ObjectId(id) };
        const studio = await studioCollection.findOne(query);

        if (!studio) {
          return res.status(404).json({
            success: false,
            message: "Studio not found",
          });
        }

        res.status(200).json({
          success: true,
          data: studio,
        });
      } catch (error) {
        console.error("Error fetching studio details:", error);
        res.status(500).json({
          success: false,
          error: error.message,
        });
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
