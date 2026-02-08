import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (event) => {
    console.log("Event:", JSON.stringify(event));

    try {
        const { groupId, description, amount, payerId, splitType, involvedUserIds, splits: providedSplits } = JSON.parse(event.body);
        const userId = event.requestContext.authorizer.claims.sub;

        if (!groupId || !description || !amount || !payerId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing required fields" }),
                headers: { "Access-Control-Allow-Origin": "*" }
            };
        }

        let finalSplits = providedSplits;

        // Calculate Equal Splits if requested
        if (splitType === 'EQUAL' && involvedUserIds && Array.isArray(involvedUserIds)) {
            const count = involvedUserIds.length;
            if (count > 0) {
                const totalCents = Math.round(amount * 100);
                const shareCents = Math.floor(totalCents / count);
                const remainderCents = totalCents % count;

                finalSplits = involvedUserIds.map((uid, index) => {
                    let userAmountCents = shareCents;
                    if (index < remainderCents) {
                        userAmountCents += 1;
                    }
                    return {
                        userId: uid,
                        amount: userAmountCents / 100
                    };
                });
            }
        }

        if (!finalSplits || finalSplits.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Splits must be provided or calculated via involvedUserIds" }),
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
            Splits: finalSplits, // Storing raw splits for now (e.g. [{userId, amount}, ...])
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
