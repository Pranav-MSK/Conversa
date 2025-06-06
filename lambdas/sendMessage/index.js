import { DynamoDBClient, ScanCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} from "@aws-sdk/client-apigatewaymanagementapi";
import admin from "firebase-admin";
import fs from "fs";

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const firestore = admin.firestore();
const ddb = new DynamoDBClient({});

export const handler = async (event) => {
  const { domainName, stage, connectionId: sender } = event.requestContext;
  const api = new ApiGatewayManagementApiClient({
    endpoint: `https://${domainName}/${stage}`
  });

  const body = JSON.parse(event.body || "{}");
  const messageText = body.data || body.message || "";
  const userId = body.targetUserId || "unknown";

  const timestamp = new Date().toISOString();
  const msg = {
    from: sender,
    message: messageText,
    timestamp
  };

  // 🔥 Store message in Firestore
  await firestore.collection("messages").add({
    from: sender,
    message: messageText,
    userId,
    timestamp
  });

  // Broadcast to all except sender
  const { Items } = await ddb.send(new ScanCommand({
    TableName: process.env.CONNECTIONS_TABLE,
    ProjectionExpression: "connectionId"
  }));

  const posts = Items.map(async (item) => {
    const targetId = item.connectionId.S;
    if (targetId === sender) return;

    try {
      await api.send(new PostToConnectionCommand({
        ConnectionId: targetId,
        Data: JSON.stringify(msg)
      }));
    } catch (err) {
      if (err.$metadata?.httpStatusCode === 410) {
        await ddb.send(new DeleteItemCommand({
          TableName: process.env.CONNECTIONS_TABLE,
          Key: { connectionId: { S: targetId } }
        }));
      } else {
        console.error("Failed to post", err);
      }
    }
  });

  await Promise.all(posts);

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, message: "Message sent and stored" })
  };
};
