import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { ezccip } from "./gateway.js";
import dotenv from "dotenv";
import { ethers } from "ethers";

// Load environment variables from .env file
dotenv.config();

// Initialize Express.js app
const app = express();
const port = parseInt(process.env.PORT!);

// Enable CORS
app.use(cors());

// Middleware to parse JSON bodies
app.use(bodyParser.json());

const RESOLVERS: {[chain: string]: `0x${string}`} = {
  'm': '0x828ec5bDe537B8673AF98D77bCB275ae1CA26D1f', // Mainnet
  's': '0x9Ec7f2ce83fcDF589487303fA9984942EF80Cb39', // Sepolia
}

// Endpoint to handle CCIP-Read requests
app.post("/:chain/:aptos", async (req, res) => {
  try {
    const { chain, aptos } = req.params
    const { sender, data: calldata } = req.body;

    // Handle the CCIP-Read request
    const { data, history } = await ezccip.handleRead(sender, calldata, {
      protocol: "tor",
      signingKey: new ethers.SigningKey(process.env.SIGNING_KEY as string), // Your private key from environment variable
      resolver: RESOLVERS[chain], // Address of the TOR from environment variable
      aptos,
      chain,
    });

    // Send the ABI-encoded response in JSON format
    res.json({ data });

    // Log the history of the response
    console.log(history.toString());
  } catch (error) {
    console.error("Error handling CCIP-Read request:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the Express.js server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
