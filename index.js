const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tydoizp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const serviceCollections = client.db('carDoctor').collection('services');
const checkoutCollections = client.db('carDoctor').collection('checkout');

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        app.get('/services', async (req, res) => {
            const courser = serviceCollections.find();
            const result = await courser.toArray();
            res.send(result);
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await serviceCollections.findOne(query);
            res.send(result);
        })

        app.get('/checkouts', async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email };
            }
            const result = await checkoutCollections.find(query).toArray();
            res.send(result)
        })

        app.post('/checkouts', async (req, res) => {
            const checkout = req.body;
            const result = await checkoutCollections.insertOne(checkout);
            res.send(result);
        })

        app.patch('/checkouts/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const update = req.body;
            const updateCheckout = {
                $set: {
                    status: update.status
                }
            };
            const result = await checkoutCollections.updateOne(filter,updateCheckout);
            res.send(result);
        })

        app.delete('/checkouts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await checkoutCollections.deleteOne(query);
            res.send(result);
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('doctor is running');
});

app.listen(port, () => {
    console.log(`doctor is running on port: ${port}`)
});