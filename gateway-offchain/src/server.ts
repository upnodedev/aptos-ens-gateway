import express, { NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { ezccip } from "./gateway.js";
import { ezccip as ezccipApt } from "./gatewayApt.js";
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
app.use(bodyParser.text({ type: "text/plain" }));

const RESOLVERS: { [chain: string]: `0x${string}` } = {
  m: "0x7CE6Cf740075B5AF6b1681d67136B84431B43AbD", // Mainnet
  s: "0x3c187BAb6dC2C94790d4dA5308672e6F799DcEC3", // Sepolia
};

// Middleware to handle text/plain content type and parse JSON string
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.is("text/plain") && typeof req.body === "string") {
    try {
      req.body = JSON.parse(req.body);
    } catch (error) {
      return res.status(400).send("Invalid JSON string");
    }
  }
  next();
});

// Endpoint to handle CCIP-Read requests
app.post("/:chain/apt", async (req, res) => {
  try {
    const { chain } = req.params;
    const { sender, data: calldata } = req.body;

    // Handle the CCIP-Read request
    const { data, history } = await ezccipApt.handleRead(sender, calldata, {
      protocol: "tor",
      signingKey: new ethers.SigningKey(process.env.SIGNING_KEY as string), // Your private key from environment variable
      resolver: RESOLVERS[chain], // Address of the TOR from environment variable
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

// Endpoint to handle CCIP-Read requests
app.post("/:chain/:aptos", async (req, res) => {
  try {
    const { chain, aptos } = req.params;
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
