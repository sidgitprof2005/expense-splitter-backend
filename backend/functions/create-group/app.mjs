import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (event) => {
    console.log("Event:", JSON.stringify(event));

    try {
        const { name, description } = JSON.parse(event.body);
        // User ID from Cognito Authorizer
        const userId = event.requestContext.authorizer.claims.sub;
        const groupId = randomUUID();
        const timestamp = new Date().toISOString();

        if (!name) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Group name is required" }),
                headers: {
                    "Access-Control-Allow-Origin": "*",
                }
            };
        }

        // Single Table Design:
        // 1. Group Metadata: PK=GROUP#<groupId>, SK=METADATA
        // 2. User Membership: PK=USER#<userId>, SK=GROUP#<groupId> (GSI1PK=USER#<userId> for list groups)
        // Actually, for "List Groups for User" we can query PK=USER#<userId> and SK begins_with GROUP#
        // We don't strictly need GSI if we duplicate data or if we look up by primary key.
        // Let's use PK=USER#<userId>, SK=GROUP#<groupId> to store the relationship.
        // Attributes: GSI1PK (optional), data...

        const groupParams = {
            TransactItems: [
                {
                    Put: {
                        TableName: TABLE_NAME,
                        Item: {
                            PK: `GROUP#${groupId}`,
                            SK: "METADATA",
                            Type: "Group",
                            Name: name,
                            Description: description,
                            CreatedBy: userId,
                            CreatedAt: timestamp,
                            UpdatedAt: timestamp,
                        },
                    },
                },
                {
                    Put: {
                        TableName: TABLE_NAME,
                        Item: {
                            PK: `USER#${userId}`,
                            SK: `GROUP#${groupId}`,
                            Type: "UserGroup",
                            GroupName: name, // Denormalized for listing without extra query
                            JoinedAt: timestamp,
                            Role: "OWNER",
                            // GSI1PK: `USER#${userId}`, // Redundant if we query PK=USER#<userId> directly
                            // GSI1SK: `GROUP#${groupId}`
                        },
                    },
                },
            ],
        };

        await docClient.send(new TransactWriteCommand(groupParams));

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "Group created successfully",
                groupId: groupId,
                name: name,
            }),
            headers: {
                "Access-Control-Allow-Origin": "*", // CORS
            },
        };
    } catch (err) {
        console.error("Error creating group:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" }),
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        };
    }
};
