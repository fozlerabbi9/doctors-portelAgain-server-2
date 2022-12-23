const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const usersCollection = client.db("doctorsPortalAgain").collection("users");
        // const serviceCollection = client.db("doctors_portal_again").collection("doctors_portal_again_services");

        app.get("/services", async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        // this is not the propre way to query
        // after learning more mongodb . use aggregate lookeup, pipeline , match , group ETC
        app.get("/available", async (req, res) => {
            const date = req.query.date;
            // const email = req.query.email;
            const query = { date: date };
            // console.log(date);
            //stape 1 : get All services
            const services = await serviceCollection.find().toArray();

            // stape 2 : get the booking of thet day
            const bookings = await bookingsCollection.find(query).toArray();  // এখানে উক্ত date (যে date user পাঠাবে) এর booking গুলো find করে বের করে আনবে,,,

            //step 3 : for each service , find booking for that service
            services.forEach(service => {
                const serviceBooking = bookings.filter(book => book.serviceName === service.name);
                const serviceBookingsSloat = serviceBooking.map(sl => sl.slots);
                // console.log(serviceBookingsSloat);
                const bookedSloats = service.slots.filter(slot => !serviceBookingsSloat.includes(slot))
                // console.log(bookedSloats);

                service.slots = bookedSloats;

            })

            res.send(services);



            // services.forEach(service => {
            //     const servicesBookings = bookings.filter(b => b.serviceName === service.name);
            //     // service.booked = servicesBookings.map(s => s.slots);
            //     const booked = servicesBookings.map(s => s.slots);
            //     service.slots = service.slots.filter(s => !booked.includes(s));
            //     // const available = service.slots.filter(s => !booked.includes(s));
            //     // service.available = available;
            // })
            // console.log(services)

            // res.send(services);
        })

        //service bookcd করা হয়েছে,,,,, একে filter করতে হবে , নিছের পদ্ধতিতে ,,,, already booking আছে কি না,,, oi date a ache ki na,,, oi Patient er same date a kono Booking ache ki na ta Chack korte hobe
        // app.post("/booking", async (req, res) => {
        //     const bookingData = req.body;
        //     const result = await bookingsCollection.insertOne(bookingData);
        //     res.send(result)
        // })
        //  +
        // add filte (chack kore dekhbe service Name , booking date , r petient name same ki na)
        app.post("/booking", async (req, res) => {
            const bookingData = req.body;
            const query = { serviceName: bookingData.serviceName, date: bookingData.date, patientName: bookingData.patientName }
            const exists = await bookingsCollection.findOne(query);
            //find kore dekhbe data ache ki na ,,, thakle return korbe r success false hisebe pathabe,,, code r samne jabe na,,, r booking na thakle (insertOne ba add korbe)
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            //booking add korbe
            const result = await bookingsCollection.insertOne(bookingData);
            res.send({ success: true, result })
        })


        // app.get("/booking/:email", async(req, res)=>{
        //     const email = req.query.email;
        //     console.log("eeeee ", email);
        // })
        app.get("/booking", async (req, res) => {
            const email = req.query.email;
            // console.log(email)
            const query = { email: email };
            const result = await bookingsCollection.find(query).toArray();
            res.send(result)
        })

        // Put API 
        app.put("/users/:email", async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })


        // DELETE API
        app.delete("/booking/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookingsCollection.deleteOne(query);
            res.send(result);
        })
    }
    finally {

    }

}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('Hello form doctors portal again server coooooooooooool')
})

app.listen(port, () => {
    console.log(`Example app listening on port ==== ${port}`)
})


