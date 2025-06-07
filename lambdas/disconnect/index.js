import { db } from "../shared/firebaseAdmin.js";
import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({});

export const handler = async (event) => {
  const { connectionId } = event.requestContext;

  // remove from DynamoDB
  await ddb.send(new DeleteItemCommand({
    TableName: process.env.CONNECTIONS_TABLE,
    Key: { connectionId: { S: connectionId } }
  }));

  // remove mapping in Firestore
  const qs = await db.collection("connections")
                     .where("connectionId","==",connectionId).get();
  const batch = db.batch();
  qs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  return { statusCode: 200, body: "Disconnected" };
};
