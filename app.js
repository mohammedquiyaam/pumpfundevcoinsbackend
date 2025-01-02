const express = require('express');

const app = express ();
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
});


app.get("/getCoins", async (request, response) => {
    let resp = [];
    const { dev, all, initialLength, phoneNum } = request.query;

    response.set('Access-Control-Allow-Origin', "*");

    try {
        let data = await fetch("https://frontend-api-v2.pump.fun/coins/user-created-coins/" + dev + "?offset=0&limit=10000&includeNsfw=false")

        data = await data.json();

        if (all === 'true') {
            resp = data;
        } else if (data.length > initialLength) {
            // new coin was added
            const numberOfCoins = data.length - initialLength
            for (let i = 0; i < numberOfCoins; i++) {
                resp.push(newList[i]);
            }
        }
    } catch(ex) {
        resp=[];
    }
    response.send(resp);
 });

