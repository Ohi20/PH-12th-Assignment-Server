const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv:${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xhayu.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const serviceCollection = client.db('server-manufacturer').collection('services');
        const bookingCollection = client.db('server-manufacturer').collection('bookings');

        app.get('/service', async(req, res) =>{
            const query = {};
            const cursor= serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/available', async(req, res)=>{
            const date = req.query.date || 'May 11, 2022';
            const services = await serviceCollection.find().toArray();
            const query = {date: date};
            const bookings = await bookingCollection.find(query).toArray();
            services.forEach(service =>{
                const serviceBookings = bookings.filter(b => b.treatment === service.name);
                const booked = serviceBookings.map(b => b.slot);
                const available = service.slots.filter(s=>!booked.includes(s));
                // service.booked = serviceBookings.map(s => s.slot);
                service.available = available;
            })
            res.send(services);
        })

        app.post('/booking', async (req, res)=>{
            const booking= req.body;
            const query = {treatment: booking.treatment, date:booking.date, patient: booking.patient};
            const exists = await bookingCollection.findOne(query);
            if(exists){
                return res.send({success: false, booking: exists})
            }
            const result= await bookingCollection.insertOne(booking);
            return res.send({success: true, result});

        })
    }
    finally{

    }
}

app.get('/', (req, res) => {
    res.send('Hello World!')
  })

  app.listen(port, () => {
    console.log(`manufucturer app listening on port ${port}`)
  })  