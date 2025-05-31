require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRE_KEY);
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://sync-force-bd.web.app/",
    "https://timely-donut-097bf2.netlify.app/",
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

        // update a user
    app.patch("/users/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      /* when admin adjust user's salary i want to update salary field from paymentCollection as well*/
      if (req.body.salary !== undefined) {
        const newSalary = req.body.salary;

        // Update salary field
        const updatedSalary = { $set: { salary: newSalary } };
        const updatedUser = await userCollection.updateOne(filter,updatedSalary);

        if (updatedUser.modifiedCount > 0) {
          // update salary field from payments
          const user = await userCollection.findOne(filter);
          const paymentFilter = { email: user.email };
          const updatedPayment = { $set: { salary: newSalary } };
          await paymentCollection.updateMany(paymentFilter, updatedPayment);

          return res.send(updatedUser);
        }
      }

      // If no salary update, update other fields
      const updatedUser = { $set: req.body };
      const result = await userCollection.updateOne(filter, updatedUser);
      res.send(result);
    });


        // Get role by user email
    app.get("/users/roles/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);

      // Use aggregate to get roles
      const roles = await userCollection
        .aggregate([
          { $group: { _id: "$role" } },
          { $project: { _id: 0, role: "$_id" } },
        ])
        .toArray();


      const isAdmin = user.role === "Admin";
      const isHR = user.role === "HR";
      const isEmployee = user.role === "Employee";

      res.send({
        userRole: user.role,
        isAdmin,
        isHR,
        isEmployee,
      });
    });


        // fire status check for login
    app.get("/users/fired-status", async (req, res) => {
      const { email } = req.query;

      const user = await userCollection.findOne({ email });

      if (!user) {
        return res.status(404).send({ error: "User not found" });
      }

      // Send the isFired status of the user
      res.send({ isFired: user.isFired });
    });


    // employee related apis

        app.post(
      "/tasks",
      verifyToken,
      verifyRole("Employee"),
      async (req, res) => {
        const user = req.body;
        const result = await taskCollection.insertOne(user);
        res.send(result);
      }
    );

        // update a task
    app.patch(
      "/tasks/:id",
      verifyToken,
      verifyRole("Employee"),
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedTask = {
          $set: req.body,
        };
        const result = await taskCollection.updateOne(filter, updatedTask);
        res.send(result);
      }
    );

        // get all tasks
    app.get("/tasks", verifyToken, verifyRole("HR"), async (req, res) => {
      const result = await taskCollection.find().toArray();
      res.send(result);
    });
    // get a specific user posted tasks
    app.get(
      "/tasks/:email",
      verifyToken,
      verifyRole("Employee"),
      async (req, res) => {
        const email = req.params.email;
        if (email !== req.decoded.email) {
          return res.status(403).send({ message: "forbidden access" });
        }
        const query = { employee_email: email };
        const result = await taskCollection.find(query).toArray();
        res.send(result);
      }
    );


        // delete a task from db
    app.delete(
      "/tasks/:id",
      verifyToken,
      verifyRole("Employee"),
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await taskCollection.deleteOne(query);
        res.send(result);
      }
    );

    // message related apis 

        // post a message to the db
    app.post("/messages", async (req, res) => {
      const message = req.body;
      const result = await messageCollection.insertOne(message);
      res.send(result);
    });
    // get all messages
    app.get("/messages", verifyToken, verifyRole("Admin"), async (req, res) => {
      const result = await messageCollection.find().toArray();
      res.send(result);
    });



    // payment related apis
    
        app.post("/payments", verifyToken, verifyRole("HR"), async (req, res) => {
      const { email, month, year } = req.body;
      const existingPayment = await paymentCollection.findOne({
        email,
        month,
        year,
      });

      if (existingPayment) {
        return res.status(400).json({
          message: "Payment already exists for selected month and year.",
        });
      }

      const payRequest = req.body;
      const result = await paymentCollection.insertOne(payRequest);

      if (result.insertedId) {
        res
          .status(201)
          .send({ message: "Payment request successfully created." });
      } else {
        res.status(500).json({ message: "Failed to create payment request." });
      }
    });


    // get all payments

    app.get("/payments", verifyToken, async (req, res) => {
      const result = await paymentCollection.find().toArray();
      res.send(result);
    });


// Update a payment request
app.patch(
  "/payments/:id",
  verifyToken,
  verifyRole("Admin"),
  async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const updatedPayment = {
      $set: req.body,
    };
    const result = await paymentCollection.updateOne(filter, updatedPayment);
    res.send(result);
  }
);




    // get a single user payment
    app.get("/payments/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await paymentCollection.findOne(query);
      res.send(result);
    });

        app.get(
      "/payments/email/:email",
      verifyToken,
      verifyRole("Employee"),
      async (req, res) => {
        const email = req.params.email;
        const query = { email: email };
        const result = await paymentCollection.find(query).toArray();
        res.send(result);
      }
    );



    // payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const { salary } = req.body;
      const amount = parseInt(salary * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "bdt",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });


        // Get user details and payment history for chart
    app.get(
      "/employee-details/:email",
      verifyToken,
      verifyRole("HR"),
      async (req, res) => {
        const { email } = req.params;
        // details
        const userQuery = { email: email };
        const userDetails = await userCollection.findOne(userQuery);

        // payment history
        const paymentQuery = { email: email };
        const paymentHistory = await paymentCollection
          .find(paymentQuery)
          .toArray();

        //format history for the chart
        const salaryHistory = paymentHistory.map((payment) => ({
          month: payment.month,
          year: payment.year,
          salary: payment.salary,
        }));

        res.send({ userDetails, salaryHistory });
      }
    );



   
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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