const express = require('express');
const app = express();
require('dotenv').config();
const port = process.env.port || 3000;
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")(process.env.Stripe_Secret_key);


app.use(express.json())
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://sage-kheer-ea2baf.netlify.app'
    ],
    credentials: true,
  })
);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zsn3kat.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const AllUser = client.db('Assignment-12').collection('All-Users');

    const AllScholarships = client.db('Assignment-12').collection('All-scholarships');
    const ApplyScholarship = client.db('Assignment-12').collection('ApplyScholarship');
    const AllReview = client.db('Assignment-12').collection('AllReview');
    // set all user into db


    // get the role of user

    app.get('/user-role/:email', async (req, res) => {
      const query = {
        email: req.params?.email
      }
      const options = {
        projection: { _id: 0, role: 1 },
      };

      const result = await AllUser.findOne(query, options);
     
      res.send(result?.role)
    })
    app.get('/all-scholarship', async (req, res) => {
      const result = await AllScholarships.find().toArray()
      res.send(result)
    })
    app.get('/all-user', async (req, res) => {
      const result = await AllUser.find().toArray()
      res.send(result)
    })
    app.get('/search-scholarship', async (req, res) => {
      const Search = req.query?.searchdata;
    
      const searchResult = await AllScholarships.find({
        $or: [
          { ScholarhipName: new RegExp(Search, 'i') },
          { UniversityName: new RegExp(Search, 'i') },
          { DegreeCategory: new RegExp(Search, 'i') },
        ]
      }).toArray()
      
      res.send(searchResult)
    })
    app.get('/scholarship/:id', async (req, res) => {

      const query = {
        _id: new ObjectId(req.params?.id)
      }
      const result = await AllScholarships.findOne(query)

      res.send(result)
    })
    app.get('/review/:id', async (req, res) => {
      const query = {
        _id: new ObjectId(req.params?.id)
      }
      const result = await AllReview.findOne(query)

      res.send(result)
    })
    app.get('/Details-Review/:id', async (req, res) => {
 
      const Id = req.params?.id
      const query = {
        ScholarhipId: Id
      }
      const result =  await  AllReview.find(query).toArray()

      res.send(result)
    })
    app.get('/all-application', async (req, res) => {

      const result = await ApplyScholarship.find().toArray()

      res.send(result)
    })
    app.get('/all-review', async (req, res) => {

      const result = await AllReview.find().toArray()

      res.send(result)
    })
    app.get('/top-scholarship', async (req, res) => {

      const sortCriteria = {
        ApplicationFees: 1, 
        postData: -1      
      };

      // Fetch and sort the documents
      const result = await AllScholarships.find().sort(sortCriteria).toArray();

      res.send(result)
    })
    app.get('/my-application/:email', async (req, res) => {

      const query = {
        'ApplicantDetails.email': req.params?.email
      }
      const result = await ApplyScholarship.find(query).toArray()

      res.send(result)
    })
    app.get('/appliedscholarship/:id', async (req, res) => {

      const query = {
        _id: new ObjectId(req.params?.id)
      }
      const result = await ApplyScholarship.findOne(query)

      res.send(result)
    })
    app.get('/my-reviews/:email', async (req, res) => {

      const query = {
        'ApplicantDetails.email': req.params?.email
      }
      const result = await AllReview.find(query).toArray()

      res.send(result)
    })
    app.post('/add-scholarship', async (req, res) => {
      const data = req.body;

      const doc = {

        ...data,
        postData: new Date()

      }
      const result = await AllScholarships.insertOne(doc);

      res.send(result);
    })

    app.post('/apply-scholarship', async (req, res) => {
      const data = req.body;
      const doc = {

        ...data,
        postData: new Date()

      }
      const result = await ApplyScholarship.insertOne(doc);

      res.send(result);
    })

    app.post("/create-payment-intent", async (req, res) => {
      const price = req.body.price
      const priceInCent = parseFloat(price) * 100
      if (!price || priceInCent < 1) return;
      const { client_secret } = await stripe.paymentIntents.create({
        amount: priceInCent,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.send({
        clientSecret: client_secret,
      });
    });

    app.put('/all-user', async (req, res) => {
      const User = req.body

      const query = { email: User?.email }
      const isExist = await AllUser.findOne(query)
      if (isExist) {
        return res.send({ message: 'your data already added in db' })
      }

      const doc = {
        ...User,
        role: 'user'
      };
      const result = await AllUser.insertOne(doc);
     
      res.send(result);
    })
    app.put('/all-review/:email', async (req, res) => {
      const data = req.body
      const query = {
        'ApplicantDetails.email': req.params?.email,
        ScholarhipId: data?.ScholarhipId
      }
      const options = { upsert: true };
      const doc = {
        $set: {
          ...data,
          Date: new Date()
        }

      };

      const result = await AllReview.updateOne(query, doc, options);
      res.send(result);
    })
    app.put('/apply-Update/:id', async (req, res) => {
      const data = req.body

      const query = { _id: new ObjectId(req.params?.id) }

      const doc = {
        $set: {
          ...data,
          Date: new Date()
        }

      };

      const result = await ApplyScholarship.updateOne(query, doc);

      res.send(result);
    })
    app.patch('/status/:id', async (req, res) => {
      const { status } = req.body;
      const query ={
        _id : new ObjectId(req.params?.id)
      }
     
      const updateDoc = {
        $set: {
          status:status
        }
      }

      const result = await ApplyScholarship.updateOne(query, updateDoc)
      res.send(result)
    })
    app.patch('/user/:id', async (req, res) => {
      const { role } = req.body;
      const query ={
        _id : new ObjectId(req.params?.id)
      }
     
      const updateDoc = {
        $set: {
          role:role
        }
      }

      const result = await AllUser.updateOne(query, updateDoc)
      res.send(result)
    })
    app.delete('/scholarship/:id', async (req, res) => {
      const query = {
        _id: new ObjectId(req.params?.id)
      }

      const result = await AllScholarships.deleteOne(query)

      res.send(result)
    })
    app.delete('/applied-scholarship/:id', async (req, res) => {
      const query = {
        _id: new ObjectId(req.params?.id)
      }

      const result = await ApplyScholarship.deleteOne(query)
      res.send(result)
    })
    app.delete('/All-review/:id', async (req, res) => {
      const query = {
        _id: new ObjectId(req.params?.id)
      }

      const result = await AllReview.deleteOne(query)
      res.send(result)
    })
    app.delete('/user/:id', async (req, res) => {
      const query = {
        _id: new ObjectId(req.params?.id)
      }

      const result = await AllUser.deleteOne(query)
      res.send(result)
    })

    // await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
