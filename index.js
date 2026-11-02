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

    // get data host email

    app.get("/my-studios/:email", async (req, res) => {
      try {
        const email = req.params.email;

        if (!email) {
          return res.status(400).json({
            success: false,
            message: "Host email parameter is required",
          });
        }

        const query = { hostEmail: email };
        const myStudios = await studioCollection.find(query).toArray();

        res.status(200).json({
          success: true,
          data: myStudios,
        });
      } catch (error) {
        console.error("Error fetching user studios:", error);
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // Delete studio

    app.delete("/studios/:id", async (req, res) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid Studio ID format",
          });
        }

        const query = { _id: new ObjectId(id) };
        const result = await studioCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Studio not found",
          });
        }

        res.status(200).json({
          success: true,
          message: "Studio deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting studio:", error);
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // update data

    app.put("/studios/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid Studio ID format",
          });
        }

        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            title: updatedData.title,
            category: updatedData.category,
            price: Number(updatedData.price),
            securityDeposit: Number(updatedData.securityDeposit),
            maxCapacity: Number(updatedData.maxCapacity),
            location: updatedData.location,
            image: updatedData.image,
            amenities: updatedData.amenities,
            description: updatedData.description,
          },
        };

        const result = await studioCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Studio not found",
          });
        }

        res.status(200).json({
          success: true,
          message: "Studio updated successfully!",
          result,
        });
      } catch (error) {
        console.error("Error updating studio:", error);
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
