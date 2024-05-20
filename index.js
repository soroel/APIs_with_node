const express=require("express")
const app=express()
app.use(express.json());
const port=8000

app.post('/',(req,res)=>{
    res.json({"respose":req.body})
})

app.listen(port,()=>{
    console.log("you are listef to port ",port)
})