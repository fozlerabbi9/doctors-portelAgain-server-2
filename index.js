const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());


// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lqiskfd.mongodb.net/?retryWrites=true&w=majority`;
const uri = `mongodb+srv://doctors_portal_again_admin:T0kLE0xRAAj7XOVX@cluster0.lqiskfd.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db("doctorsPortalAgain").collection("doctorsPortalAgainServices");
        const bookingsCollection = client.db("doctorsPortalAgain").collection("doctorsPortalAgainBookings");
        // const serviceCollection = client.db("doctors_portal_again").collection("doctors_portal_again_services");

        app.get("/services", async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        //service bookcd করা হয়েছে,,,,, একে filter করতে হবে , নিছের পদ্ধতিতে ,,,, already booking আছে কি না,,, oi date a ache ki na,,, oi Patient er same date a kono Booking ache ki na ta Chack korte hobe
        // app.post("/booking", async (req, res) => {
        //     const bookingData = req.body;
        //     const result = await bookingsCollection.insertOne(bookingData);
        //     res.send(result)
        // })
        //  +
        // add filte (mil kore dekhbe service Name , booking date , ar petient name same ki na)
        app.post("/booking", async (req, res) => {
            const bookingData = req.body;
            const query = { serviceName: bookingData.serviceName, date: bookingData.date, patientName: bookingData.patientName }
            const exists = await bookingsCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await bookingsCollection.insertOne(bookingData);
            res.send({ success: true, result })
        })


        // app.get("/booking/:email", async(req, res)=>{
        //     const email = req.params.email;
        //     console.log("eeeee ", email);
        // })
        app.get("/booking", async (req, res) => {
            const query = {};
            const result = await bookingsCollection.find(query).toArray();
            res.send(result)
        })
    }
    finally {

    }

}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('Hello form doctors portal again server')
})

app.listen(port, () => {
    console.log(`Example app listening on port ==== ${port}`)
})


