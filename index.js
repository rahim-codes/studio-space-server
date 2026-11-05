import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { jwtVerify } from "jose";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

dotenv.config();

const app = express();
// app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

const PORT = process.env.PORT || 8000;

// Middleware

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
    const bookingCollection = database.collection("bookings");

    const SESSION_JWT_COOKIE = "better-auth.session_data";

    const getSessionJwt = (cookies) => {
      const direct =
        cookies[SESSION_JWT_COOKIE] ||
        cookies[`__Secure-${SESSION_JWT_COOKIE}`];
      if (direct) return direct;

      // Cookie cache may be split into chunks: name.0, name.1, ...
      const chunkNames = Object.keys(cookies)
        .filter((name) => name.startsWith(`${SESSION_JWT_COOKIE}.`))
        .sort(
          (a, b) =>
            Number(a.slice(SESSION_JWT_COOKIE.length + 1)) -
            Number(b.slice(SESSION_JWT_COOKIE.length + 1)),
        );
      if (chunkNames.length === 0) return null;
      return chunkNames.map((name) => cookies[name]).join("");
    };

    const verifyAuth = async (req, res, next) => {
      try {
        const token = getSessionJwt(req.cookies || {});

        if (!token) {
          return res
            .status(401)
            .json({ success: false, message: "Unauthorized" });
        }

        const secret = new TextEncoder().encode(process.env.BETTER_AUTH_SECRET);
        const { payload } = await jwtVerify(token, secret, {
          algorithms: ["HS256"],
        });

        req.user = payload;
        next();
      } catch (error) {
        console.error("JWT verification failed:", error.message);
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }
    };

    app.get("/", (req, res) => {
      res.send("Express & Native MongoDB Atlas Server is running! 🚀");
    });

    const createStudio = async (req, res) => {
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
    };

    app.post("/studios", verifyAuth, createStudio);
    app.post("/api/studios", verifyAuth, createStudio);

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

    app.get("/my-studios/:email", verifyAuth, async (req, res) => {
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

    // Category was data get

    app.get("/studios/category/:categoryName", async (req, res) => {
      try {
        const categoryName = req.params.categoryName;

        const query = { category: categoryName };
        const studios = await studioCollection.find(query).toArray();

        res.status(200).json({
          success: true,
          count: studios.length,
          data: studios,
        });
      } catch (error) {
        console.error("Error fetching studios by category:", error);
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // Delete studio

    const deleteStudio = async (req, res) => {
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
    };

    app.delete("/studios/:id", verifyAuth, deleteStudio);
    app.delete("/api/studios/:id", verifyAuth, deleteStudio);

    // update data

    app.patch("/studios/:id", async (req, res) => {
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

    // Bookings data

    const createBooking = async (req, res) => {
      try {
        const bookingData = req.body;

        const newBooking = {
          ...bookingData,
          createdAt: new Date(),
          status: "pending",
        };

        const result = await bookingCollection.insertOne(newBooking);

        res.status(201).json({
          success: true,
          message: "Workspace booked successfully!",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    };

    app.post("/bookings", verifyAuth, createBooking);
    app.post("/api/bookings", verifyAuth, createBooking);

    // get booking data
    app.get("/bookings/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { "userInfo.userEmail": email };
        const result = await bookingCollection.find(query).toArray();
        res.status(200).json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // update booking data

    app.patch("/bookings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { status } = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { status: status } };

        const result = await bookingCollection.updateOne(filter, updateDoc);
        res.status(200).json({
          success: true,
          message: "Booking updated successfully",
          result,
        });
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
