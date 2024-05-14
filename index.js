const express = require('express');
const cors = require('cors');
require("dotenv").config();
const app = express();
const port=process.env.PORT || 3000;
const { MongoClient, ServerApiVersion } = require("mongodb");

//middleware
app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o0npkhl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
        const JobNestDB = client.db("JobNestDB").collection("jobs");
        

        app.get("/all", async (req, res) => {
            const result = await JobNestDB.find().toArray();
            res.send(result);
        });
        app.post('/all',async (req, res) => {
            const job = req.body;
            const result = await JobNestDB.insertOne(job);
            res.send(result);
        });
    

        

        
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        
    }
}


run().catch(console.error);




app.get('/',(req,res)=>
{
    res.send("Job Server is running");
})

app.listen(port,()=>
{
    console.log(`Server is running on port ${port}`);
})