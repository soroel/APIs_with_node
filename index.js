const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

app.get("/", (req, res) => {
    res.send("Hello World");
});

const generateToken = async (req, res, next) => {
    const secret = process.env.MPESA_CONSUMER_SECRET;
    const key = process.env.MPESA_CONSUMER_KEY;
    const auth = Buffer.from(`${key}:${secret}`).toString("base64");

    try {
        const response = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
            headers: {
                Authorization: `Basic ${auth}`,
            }
        });
        token = response.data.access_token;
        //console.log(`Generated Token: ${token}`);
        token = response.data.access_token;
        next();
    } catch (err) {
        console.error('Error generating token:', err.response ? err.response.data : err.message);
        res.status(400).json({ error: err.message });
    }
};

app.post("/stk", generateToken, async (req, res) => {
    const phone = req.body.phone.substring(1);
    const amount = req.body.amount;

    const date = new Date();
    const timestamp = date.getFullYear() +
        ("0" + (date.getMonth() + 1)).slice(-2) +
        ("0" + date.getDate()).slice(-2) +
        ("0" + date.getHours()).slice(-2) +
        ("0" + date.getMinutes()).slice(-2) +
        ("0" + date.getSeconds()).slice(-2);

    const shortcode = process.env.MPESA_PAYBILL;
    const passkey = process.env.MPESA_PASSKEY;
    
    const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");

    // console.log(`Timestamp: ${timestamp}`);
    // console.log(`Password: ${password}`);
    // console.log(`Token: ${token}`);

    try {
        const response = await axios.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: `254${phone}`,
            PartyB: shortcode,
            PhoneNumber: `254${phone}`,
            CallBackURL: "https://mydomain.com/path",
            AccountReference: `254${phone}`,
            TransactionDesc: "Test"
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        });
        console.log(response.data);
        res.status(200).json(response.data);
    } catch (err) {
        console.error('Error in STK push request:', err.response ? err.response.data : err.message);
        res.status(500).json({ error: err.message });
    }
});
