import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (event) => {
    console.log("Event:", JSON.stringify(event));

    try {
        const groupId = event.pathParameters.groupId;

        if (!groupId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing groupId" }),
                headers: { "Access-Control-Allow-Origin": "*" }
            };
        }

        const userId = event.requestContext.authorizer.claims.sub;

        // 0. Validate User Membership
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

        // 1. Fetch all expenses for the group
        const params = {
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
                ":pk": `GROUP#${groupId}`,
                ":sk": "EXPENSE#"
            }
        };

        const result = await docClient.send(new QueryCommand(params));
        const expenses = result.Items || [];

        // 2. Calculate Balances
        const balances = {}; // userId -> netAmount (positive = retrieves, negative = owes)

        expenses.forEach(expense => {
            const payerId = expense.PayerId;
            const amount = parseFloat(expense.Amount);
            const splits = expense.Splits || [];

            // Payer gets +amount (they paid, so they are owed this back initially)
            balances[payerId] = (balances[payerId] || 0) + amount;

            // Subtract each user's share
            splits.forEach(split => {
                const userId = split.userId;
                const splitAmount = parseFloat(split.amount);
                balances[userId] = (balances[userId] || 0) - splitAmount;
            });
        });

        // 3. Calculate Transactions (Simplified Debt Simplification)
        // Separate into debtors (owes money) and creditors (owed money)
        let debtors = [];
        let creditors = [];

        for (const [userId, amount] of Object.entries(balances)) {
            if (amount < -0.01) debtors.push({ userId, amount }); // owes
            else if (amount > 0.01) creditors.push({ userId, amount }); // owed
        }

        debtors.sort((a, b) => a.amount - b.amount); // ascending (most negative first)
        creditors.sort((a, b) => b.amount - a.amount); // descending (most positive first)

        const settlements = [];

        let i = 0; // debtor index
        let j = 0; // creditor index

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];

            // The amount to settle is the minimum of what debtor owes and creditor is owed
            const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

            // Round to 2 decimals
            const roundedAmount = Math.round(amount * 100) / 100;

            if (roundedAmount > 0) {
                settlements.push({
                    from: debtor.userId,
                    to: creditor.userId,
                    amount: roundedAmount
                });
            }

            // Update remaining amounts
            debtor.amount += amount;
            creditor.amount -= amount;

            // If settled, move to next
            if (Math.abs(debtor.amount) < 0.01) i++;
            if (creditor.amount < 0.01) j++;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                groupId: groupId,
                balances: balances,
                settlements: settlements
            }),
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        };
    } catch (err) {
        console.error("Error calculating settlements:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" }),
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        };
    }
};
