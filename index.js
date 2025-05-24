require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRE_KEY);
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://workforcepro.netlify.app",
    "https://assignment-12-7ff66.web.app",
  ],
  credentials: true,
};
// middleware
app.use(cors(corsOptions));
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.c502c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const userCollection = client.db("Assignment12-DB").collection("users");
    const taskCollection = client.db("Assignment12-DB").collection("tasks");
    const paymentCollection = client.db("Assignment12-DB").collection("payments");
    const messageCollection = client.db("Assignment12-DB").collection("messages");

    // JWT apis

     app.post("/jwt", async (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5d",
      });
      res.send({ token });
    });
    // verify token
    const verifyToken = (req, res, next) => {
      // console.log("inside verify", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

        // verifyRole middleware
    const verifyRole = (role) => async (req, res, next) => {
      try {
        const email = req.decoded?.email;
        if (!email) {
          return res.status(401).send({ message: "Unauthorized access" });
        }

        // Find the user in the database
        const user = await userCollection.findOne({ email });
        if (!user || user.role !== role) {
          return res
            .status(403)
            .send({ message: `Access denied for role: ${role}` });
        }

        next();
      } catch (error) {
        console.error("Error in verifyRole:", error.message);
        res.status(500).send({ message: "Internal server error" });
      }
    };


        // post user to the db
    app.post("/users", async (req, res) => {
      const user = req.body;
      // only create user if user already doesn't exist
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({
          message: "already exist this user",
          insertedId: null,
        });
      }
      // if new user
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    // get all users from db
    app.get("/users", verifyToken, async (req, res) => {
      const { role, isVerified } = req.query;
      const query = {};
      if (role) query.role = role;
      if (isVerified !== undefined) query.isVerified = isVerified === "true";
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });


    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('sync force server is running')
})

app.listen(port, ()=>{
    console.log(`Sync force is waiting at: ${port}`)
})