const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const cookiePerser=require('cookie-parser')
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");

//middleware
app.use(cors({
  origin:[
    'http://localhost:5173'
  ],
  credentials:true
}));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o0npkhl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});



//middleware

const verifyJWT=(req, res, next) => {

  const token=req?.cookies?.token;
  // console.log(token);
  if(!token)
    {
      return res.status(401).send({message:'Unathorized access'})
    }
    jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>
    {
      if(err)
        {
          return res.send({message:'UnAthorized access'})
        }
      req.user=decoded;
      next();
    })
  
}




async function run() {
  try {
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    const JobNestDB = client.db("JobNestDB").collection("jobs");
    const applyNestDB = client.db("JobNestDB").collection("applications");

    app.post('/jwt',async (req, res) => {
      const user= req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET,{expiresIn:'1h'});
      res.cookie('token',token,{
        httpOnly: true,
        secure:true,
        sameSite:'none'
      })
      res.send({success:true});
  })
  app.post('/logout',async (req,res)=>
  {
    const user = req.body;
    res.clearCookie('token',{maxAge:0}).send({success:true})
  })
    app.get("/all", async (req, res) => {
      const result = await JobNestDB.find().toArray();
      res.send(result);
    });
    app.get("/posted",verifyJWT, async (req, res) => {
      if(req.user.email!==req.query.email)
        {
          return res.status(403).send({message:'Forbidden Request'});
        }
      let query = {};

      if (req.query?.email) {
        query = { email: req.query.email };
      }
      
      const result = await JobNestDB.find(query).toArray();
      res.send(result);
    });
    app.get("/applyBy", async (req, res) => {
      const result = await applyNestDB.find().toArray();
      res.send(result);
    });
    app.get("/applyByAll",verifyJWT, async (req, res) => {
      
      let query = {};
      if (req.query?.email) {
        query = { applicantEmail: req.query.email };
      }
      console.log(query);
      const result = await applyNestDB.find(query).toArray();
      res.send(result);
    });
    app.post("/all", async (req, res) => {
      const job = req.body;
      const result = await JobNestDB.insertOne(job);
      res.send(result);
    });
    app.get("/details/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await JobNestDB.findOne(query);
      res.send(result);
    });
    app.post("/details/:id", async (req, res) => {
      const id = req.params.id;
      const job = await JobNestDB.findOne({ _id: new ObjectId(id) });
      const jobApplicantsNumber = parseInt(job.jobApplicantsNumber);

      const result = await JobNestDB.updateOne(
        { _id: new ObjectId(id) },
        { $set: { jobApplicantsNumber: jobApplicantsNumber + 1 } }
      );
      res.send(result);
    });

    app.post("/applyBy", async (req, res) => {
      const apply = req.body;
      const result = await applyNestDB.insertOne(apply);
      res.send(result);
    });
    app.get("/checkApplication", async (req, res) => {
      const jobId = req.query.jobId;
      const applicantEmail = req.query.applicantEmail;
      console.log(jobId, applicantEmail);

      const existingApplication = await applyNestDB.findOne({
        ID: jobId,
        applicantEmail: applicantEmail,
      });
      console.log(!!existingApplication);

      res.send({ applied: Boolean(existingApplication) });
    });
    // delete
    app.delete("/delete/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await JobNestDB.deleteOne(query);
        console.log(result)
        res.send(result);
    });
    app.patch('/update/:id', async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const result = await JobNestDB.updateOne(filter, { $set: req.body }, options);
        res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}

run().catch(console.error);

app.get("/", (req, res) => {
  res.send("Job Server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
