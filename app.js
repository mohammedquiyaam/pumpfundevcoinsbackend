const express = require('express');

const app = express ();
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
});

const bs58 = require('bs58');
const { VersionedTransaction, Connection, Keypair } = require('@solana/web3.js');

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com/";
const web3Connection = new Connection(
    RPC_ENDPOINT,
    'confirmed',
);

app.get("/getCoins", async (request, response) => {
    let resp = {};
    resp.data=[];
    resp.messages = [];
    const { dev, all, lastCoinMint, buy, key, amount, slippage, priorityFee, phoneNum } = request.query;

    response.set('Access-Control-Allow-Origin', "*");

    try {
        let data = await fetch("https://frontend-api-v2.pump.fun/coins/user-created-coins/" + dev + "?offset=0&limit=10000&includeNsfw=false")

        data = await data.json();

        // testing 
        // await buyCoin("buy", data[0].mint, amount, slippage, key)
        
        if (all === 'true') {
            resp.data = data;
        } else {
            for (let i = 0; i < data.length; i++) {
                const coin = data[i];
                if (coin.mint == lastCoinMint) {
                    break;
                } else {
                    resp.data.push(coin);
                    if (buy === 'true'){
                        const success = await buyCoin("buy", coin.mint, amount, slippage, priorityFee, key)
                        if (success) {
                            resp.messages.push("Bought " + amount + " Solana worth of " + coin.name);
                        } else {
                            resp.messages.push("New coin created but could not buy");
                        }
                    }
                }
            }
        }
    } catch(ex) {
        resp.data=[];
    }

    if (!resp.data) resp.data = [];
    if (!resp.messages) resp.messages = [];

    response.send(resp);
 });


async function buyCoin(action, mint, amount, slippage, priorityFee, key){
    let success = false;
    const signerKeyPair = Keypair.fromSecretKey(bs58.decode(key));
    const signerPublicKey = signerKeyPair.publicKey.toBase58();

    let tries = 0;
    while (!success && tries < 20) {
        tries++;
        try {
            const response = await fetch(`https://pumpportal.fun/api/trade-local`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "publicKey": signerPublicKey,  // Your wallet public key
                    "action": action,                 // "buy" or "sell"
                    "mint": mint,         // contract address of the token you want to trade
                    "denominatedInSol": "true",     // "true" if amount is amount of SOL, "false" if amount is number of tokens
                    "amount": amount,                  // amount of SOL or tokens
                    "slippage": slippage,                  // percent slippage allowed
                    "priorityFee": priorityFee,          // priority fee
                    "pool": "pump"                   // exchange to trade on. "pump" or "raydium"
                })
            });
            if(response.status === 200){ // successfully generated transaction
                const data = await response.arrayBuffer();
                const tx = VersionedTransaction.deserialize(new Uint8Array(data));
                tx.sign([signerKeyPair]);
                const signature = await web3Connection.sendTransaction(tx)
                console.log("Transaction: https://solscan.io/tx/" + signature);
                success = true;
            } else {
                console.log(response.statusText); // log error
            }
        } catch(ex) {
            console.log(ex);

        }
        if (!success) await timeout(3000);
    }
    return success;
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
