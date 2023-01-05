const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
require("dotenv").config();

app.use(cors());
app.use(express.json());

const verifyJwt = (req, res, next) => {
    // console.log('======verifyJwt')
    const authorizToken = req.headers?.authorization;
    console.log(authorizToken);
    if (!authorizToken) {
        return res.status(401).send({ message: "UnAuthorized Access" })
    }

    const token = authorizToken.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Forbidden Access" })
        }
        // console.log(decoded)
        req.decoded = decoded;
        next()
    })

}
// console.log(process.env.ACCESS_SECRET_TOKEN)


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

        app.get("/admin/:email", async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email: email });
            const isAdmin = user.role === "admin";
            res.send({ admin: isAdmin });
        });

        // (myAppointment) er api theke assche  email assche and body te authorization hisebe Berer a ("accessToken") asseche
        // app.get("/booking", async (req, res) => {
        app.get("/booking", verifyJwt, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {

                // const authorization = req?.headers?.authorization;
                // const authoriToken = authorization?.split(" ")[1];
                // console.log("===", authoriToken);
                const query = { email: email };
                const result = await bookingsCollection.find(query).toArray();
                return res.send(result)
            }
            else {
                return res.status(403).send({ message: "Forbidden access" })
            }
        })

        // make a admin (API) admin button a click korle ei api ta kaj korbe,,,, allusers.js file......
        // app.put("/users/admin/:email", verifyJwt, async (req, res) => {
        app.put("/users/admin/:email", verifyJwt, async (req, res) => {
            const email = req.params.email;
            const requister = req.decoded.email;
            const requisterAccount = await usersCollection.findOne({ email: requister });
            if (requisterAccount.role === "admin") {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: "admin" },
                };
                const result = await usersCollection.updateOne(filter, updateDoc);
                res.send(result)
            }
            else {
                res.status(403).send({ message: "forbidden" })
            }


        })

        // remove admin panale (update role and remove admin  API hit form allUser. js file removeAdmin fun)
        app.put("/removeAdmin/:email", async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: { role: " " }
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })

        // Put API  (useToken) theke ascche,,,,,================= এই api তো token generate korbe ,,, back end থেক নিয়ে front end এ পাঠাবে ,,,
        // app.put("/users/:email", async (req, res) => {
        app.put("/users/:email", async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            console.log("genarating token")
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_SECRET_TOKEN, { expiresIn: '1y' });
            res.send({ result, accessToken: token });
        })

        // (All users Api for all users component)
        // app.get('/users', verifyJwt, async (req, res) => {
        app.get('/users', verifyJwt, async (req, res) => {         // ====== >> varify fun thakar karone map kaj korse na 
            const result = await usersCollection.find().toArray();
            res.send(result);
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


