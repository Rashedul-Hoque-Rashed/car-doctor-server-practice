const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());




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

const logger = async (req, res, next) => {
    console.log('called:', req.host, req.originalUrl);
    next();
}
const verifyToken = async(req, res, next) => {
    const token = req.cookies?.accessToken;
    console.log('verify:', token)
    if(!token){
        return res.status(401).send({message: 'Not Authorize'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decode) => {
        if(error){
            console.log(error)
            return res.status(401).send({message: 'Unauthorize'})
        }
        console.log('value of decode:', decode);
        req.user = decode;
        next();
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // auth api
        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

            res
                .cookie('accessToken', token, {
                    httpOnly: true,
                    secure: false
                })
                .send({ success: true })
        })



        // client api
        app.get('/services', logger, async (req, res) => {
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

        app.get('/checkouts', logger, verifyToken, async (req, res) => {
            console.log('token', req.cookies.accessToken)

            if(req.query.email !== req.user.email){
                return res.status(403).send({message: 'Forbidden access'})
            }

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
            const result = await checkoutCollections.updateOne(filter, updateCheckout);
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