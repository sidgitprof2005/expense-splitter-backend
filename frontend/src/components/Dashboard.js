import React, { useState, useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import AddExpense from "./AddExpense";
import ExpenseList from "./ExpenseList";
import BalanceSheet from "./BalanceSheet";
import GroupList from "./GroupList";
// import "../App.css"; // Assuming App.css is globally applied or imported in App.js

const API_URL = "https://yon759bwxf.execute-api.ap-south-1.amazonaws.com/Prod";

function Dashboard({ user, signOut }) {
    const [view, setView] = useState("GROUPS"); // GROUPS or DETAILS
    const [groups, setGroups] = useState([]);
    const [currentGroup, setCurrentGroup] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);

    // Helper to get JWT token
    const getAuthHeader = async () => {
        const session = await fetchAuthSession();
        return {
            Authorization: session.tokens.idToken.toString(),
            "Content-Type": "application/json",
        };
    };

    // Fetch User's Groups
    const fetchGroups = async () => {
        try {
            setLoading(true);
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/groups`, { headers });
            if (!res.ok) throw new Error("Failed to fetch groups");
            const data = await res.json();
            setGroups(data.groups || data || []);
        } catch (err) {
            console.error("Error fetching groups:", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Expenses for a Group
    const fetchExpenses = async (groupId) => {
        try {
            setLoading(true);
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/groups/${groupId}/expenses`, { headers });
            if (!res.ok) throw new Error("Failed to fetch expenses");
            const data = await res.json();
            setExpenses(data.expenses || []);
        } catch (err) {
            console.error("Error fetching expenses:", err);
        } finally {
            setLoading(false);
        }
    };

    // Create Group
    const createGroup = async (name, description) => {
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/groups`, {
                method: "POST",
                headers,
                body: JSON.stringify({ name, description }),
            });
            if (!res.ok) throw new Error("Failed to create group");
            const newGroup = await res.json();
            // Refresh groups
            fetchGroups();
        } catch (err) {
            console.error("Error creating group:", err);
            alert("Failed to create group");
        }
    };

    // Add Expense
    const addExpense = async (expenseData) => {
        if (!currentGroup) return;
        try {
            const headers = await getAuthHeader();

            const body = {
                groupId: currentGroup.groupId || (currentGroup.PK && currentGroup.PK.split("#")[1]),
                description: expenseData.description,
                amount: expenseData.amount,
                payerId: expenseData.paidBy,
                splitType: "CUSTOM",
                splits: expenseData.splits
            };

            const res = await fetch(`${API_URL}/expenses`, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to add expense");
            }

            const newExpense = await res.json();
            // Refresh expenses
            fetchExpenses(currentGroup.groupId || (currentGroup.PK && currentGroup.PK.split("#")[1]));
        } catch (error) {
            console.error("Error adding expense:", error);
            alert("Error adding expense: " + error.message);
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchGroups();
    }, []);

    const handleSelectGroup = (group) => {
        setCurrentGroup(group);
        const gid = group.groupId || (group.PK && group.PK.split("#")[1]);
        fetchExpenses(gid);
        setView("DETAILS");
    };

    const handleBack = () => {
        setCurrentGroup(null);
        setExpenses([]);
        setView("GROUPS");
        fetchGroups(); // Refresh logic if needed
    };

    // Dummy users for the dropdown
    const dummyUsers = [
        { id: "user1", name: "Me (You)" },
        { id: "user2", name: "Alice" },
        { id: "user3", name: "Bob" },
        { id: "user4", name: "Charlie" }
    ];

    return (
        <div className="App gradient-bg animated-container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', color: 'white' }}>
                <h1 className="app-title" style={{ margin: 0 }}>💸 Expense Splitter</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>Hello, {user.username}</span>
                    <button onClick={signOut} style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Sign Out</button>
                </div>
            </header>

            {loading && <p style={{ textAlign: 'center', color: 'white' }}>Loading...</p>}

            {view === "GROUPS" && (
                <div className="fade-in">
                    <GroupList
                        groups={groups}
                        onCreateGroup={createGroup}
                        onSelectGroup={handleSelectGroup}
                    />
                </div>
            )}

            {view === "DETAILS" && currentGroup && (
                <div className="fade-in">
                    <button onClick={handleBack} style={{ margin: '20px', padding: '8px 16px', cursor: 'pointer' }}>← Back to Groups</button>
                    <h2 style={{ textAlign: 'center', color: 'white' }}>{currentGroup.groupName || currentGroup.name}</h2>

                    <div className="card">
                        <AddExpense users={dummyUsers} addExpense={addExpense} />
                    </div>
                    <div className="card delay-1">
                        <ExpenseList expenses={expenses} />
                    </div>
                    <div className="card delay-2">
                        <BalanceSheet
                            users={dummyUsers}
                            expenses={expenses}
                            onReminder={() => alert("Reminder feature coming soon!")}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
