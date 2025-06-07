import { db } from "../shared/firebaseAdmin.js";
import {
  DynamoDBClient,
  ScanCommand,
  DeleteItemCommand
} from "@aws-sdk/client-dynamodb";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} from "@aws-sdk/client-apigatewaymanagementapi";

const ddb = new DynamoDBClient({});

export const handler = async (event) => {
  const { domainName, stage, connectionId: senderConnId } =
    event.requestContext;
  const api = new ApiGatewayManagementApiClient({
    endpoint: `https://${domainName}/${stage}`
  });

  const body = JSON.parse(event.body || "{}");
  const text = body.data || body.message || "";

  /* ─── Who sent this? ─── */
  const snap = await db.collection("connections")
                       .where("connectionId", "==", senderConnId)
                       .limit(1)
                       .get();

  const senderId   = snap.empty ? "unknown"  : snap.docs[0].id;
  const senderNick = snap.empty ? "Anonymous":
                     (snap.docs[0].data().nickname || "Anonymous");

  /* ─── Persist chat message ─── */
  const msg = { senderId, senderNick, text, timestamp: Date.now() };
  await db.collection("messages").add(msg);

  /* ─── Broadcast to everyone else ─── */
  const scanOut = await ddb.send(new ScanCommand({
    TableName: process.env.CONNECTIONS_TABLE,
    ProjectionExpression: "connectionId"
  }));
  const conns = scanOut.Items ?? [];

  const tasks = conns.map(async ({ connectionId: { S: targetId } }) => {
    if (targetId === senderConnId) return;

    try {
      await api.send(new PostToConnectionCommand({
        ConnectionId: targetId,
        Data: JSON.stringify({ from: senderNick, text: msg.text, ts: msg.timestamp })
      }));
    } catch (err) {
      if (err.name === "GoneException" || err.$metadata?.httpStatusCode === 410) {
        /* stale socket → clean DynamoDB & Firestore */
        await ddb.send(new DeleteItemCommand({
          TableName: process.env.CONNECTIONS_TABLE,
          Key: { connectionId: { S: targetId } }
        }));
        const q = await db.collection("connections")
                          .where("connectionId", "==", targetId).get();
        q.forEach(doc => doc.ref.delete());
      } else {
        console.error("PostToConnection failed:", err);
      }
    }
  });

  await Promise.allSettled(tasks);
  return { statusCode: 200, body: "Sent & stored" };
};
