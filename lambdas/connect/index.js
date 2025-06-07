import { db } from "../shared/firebaseAdmin.js";
import { getAuth } from "firebase-admin/auth";
import {
  DynamoDBClient,
  PutItemCommand
} from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({});
const TTL_SECONDS = 60 * 60;          // 1 h

export const handler = async (event) => {
  const { connectionId } = event.requestContext;
  const { token = "", nickname = "Anonymous" } =
    event.queryStringParameters ?? {};

  /* ─── Verify Firebase ID token ─── */
  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(token);
  } catch (err) {
    console.error("Bad Firebase token:", err);
    return { statusCode: 401, body: "Unauthorized" };
  }

  const userId = decoded.uid;

  /* 1️⃣  Save connection in DynamoDB (with TTL for auto-purge) */
  await ddb.send(new PutItemCommand({
    TableName: process.env.CONNECTIONS_TABLE,
    Item: {
      connectionId: { S: connectionId },
      expiresAt    : { N: String(Math.floor(Date.now() / 1000) + TTL_SECONDS) }
    }
  }));

  /* 2️⃣  Map uid → connectionId in Firestore */
  await db.collection("connections").doc(userId).set({
    connectionId,
    nickname,
    updatedAt: Date.now()
  });

  return { statusCode: 200, body: "Connected" };
};
