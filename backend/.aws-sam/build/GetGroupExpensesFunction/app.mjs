import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (event) => {
    console.log("Event:", JSON.stringify(event));

    try {
        const groupId = event.pathParameters.groupId;
        const userId = event.requestContext.authorizer.claims.sub;

        if (!groupId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing groupId" }),
                headers: { "Access-Control-Allow-Origin": "*" }
            };
        }

        // 1. Validate User Membership
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

        // 2. Query Expenses
        const params = {
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
                ":pk": `GROUP#${groupId}`,
                ":sk": "EXPENSE#"
            }
        };

        const result = await docClient.send(new QueryCommand(params));

        const expenses = (result.Items || []).map(item => ({
            expenseId: item.SK.replace("EXPENSE#", ""),
            description: item.Description,
            amount: item.Amount,
            payerId: item.PayerId,
            createdAt: item.CreatedAt,
            splits: item.Splits
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({
                groupId: groupId,
                expenses: expenses
            }),
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        };
    } catch (err) {
        console.error("Error getting group expenses:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" }),
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        };
    }
};
