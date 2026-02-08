import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (event) => {
    console.log("Event:", JSON.stringify(event));

    try {
        const { groupId, description, amount, payerId, splits } = JSON.parse(event.body);
        const userId = event.requestContext.authorizer.claims.sub;

        if (!groupId || !description || !amount || !payerId || !splits) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing required fields" }),
                headers: { "Access-Control-Allow-Origin": "*" }
            };
        }

        // 1. Validate User Membership in Group
        // Check if item PK=USER#<userId>, SK=GROUP#<groupId> exists
        const membershipParams = {
            TableName: TABLE_NAME,
            Key: {
                PK: `USER#${userId}`,
                SK: `GROUP#${groupId}`
            }
        };
        const membershipResult = await docClient.send(new GetCommand(membershipParams));

        if (!membershipResult.Item) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: "You are not a member of this group" }),
                headers: { "Access-Control-Allow-Origin": "*" }
            };
        }

        // 2. Create Expense Item
        const expenseId = randomUUID();
        const timestamp = new Date().toISOString();

        const expenseItem = {
            PK: `GROUP#${groupId}`,
            SK: `EXPENSE#${expenseId}`,
            Type: "Expense",
            Description: description,
            Amount: amount,
            PayerId: payerId,
            Splits: splits, // Storing raw splits for now (e.g. [{userId, amount}, ...])
            CreatedBy: userId,
            CreatedAt: timestamp,
        };

        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: expenseItem
        }));

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "Expense added successfully",
                expenseId: expenseId,
                expense: expenseItem
            }),
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        };
    } catch (err) {
        console.error("Error adding expense:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" }),
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        };
    }
};
