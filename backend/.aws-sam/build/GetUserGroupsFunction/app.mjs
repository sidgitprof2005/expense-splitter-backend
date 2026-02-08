import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (event) => {
    console.log("Event:", JSON.stringify(event));

    try {
        const userId = event.requestContext.authorizer.claims.sub;

        // Query PK=USER#<userId> and SK begins_with GROUP#
        const params = {
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
                ":pk": `USER#${userId}`,
                ":sk": "GROUP#"
            }
        };

        const result = await docClient.send(new QueryCommand(params));

        // Transform result to be cleaner
        const groups = (result.Items || []).map(item => ({
            groupId: item.SK.replace("GROUP#", ""),
            name: item.GroupName,
            role: item.Role,
            joinedAt: item.JoinedAt
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({
                groups: groups
            }),
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        };
    } catch (err) {
        console.error("Error getting user groups:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" }),
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        };
    }
};
