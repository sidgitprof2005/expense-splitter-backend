import React, { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { fetchAuthSession } from "aws-amplify/auth";
import AddExpense from "./components/AddExpense";
import ExpenseList from "./components/ExpenseList";
import BalanceSheet from "./components/BalanceSheet";
import GroupList from "./components/GroupList";
import "./App.css";

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "ap-south-1_Qkz7K9VRa",
      userPoolClientId: "46ljukd3i8uhh8uubmdaquqcg2",
    },
  },
});

const API_URL = "https://yon759bwxf.execute-api.ap-south-1.amazonaws.com/Prod";

function App() {
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
      // data might be { groups: [] } or just [] depending on backend
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
      const payload = {
        ...expenseData,
        groupId: currentGroup.groupId || currentGroup.PK.split("#")[1], // Extract ID
        payerId: expenseData.paidBy, // Simple mapping for now
        // Backend expects 'involvedUserIds' for EQUAL split calculation if splits not provided
        // But AddExpense component sends 'splits' object if custom
        // We'll trust the component sends mostly right data, but might need adjustment
      };

      // Adaptation: The backend 'add-expense' expects specific fields
      // We might need to adjust what AddExpense.js sends or what we send here.
      // Let's pass the raw expenseData for now and debug if needed.
      // Actually, let's just make sure we send groupId.
      const res = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          groupId: currentGroup.groupId || currentGroup.PK.split("#")[1],
          description: expenseData.description,
          amount: expenseData.amount,
          payerId: expenseData.paidBy, // Assuming paidBy is a user ID or Name
          splitType: Object.keys(expenseData.splits).length > 0 ? "CUSTOM" : "EQUAL",
          splits: [], // We might need to map the splits object to array
          involvedUserIds: Object.keys(expenseData.splits), // For EQUAL split
        }),
      });

      const body = {
        groupId: currentGroup.groupId || (currentGroup.PK && currentGroup.PK.split("#")[1]),
        description: expenseData.description,
        amount: expenseData.amount,
        payerId: expenseData.paidBy,
        splitType: "CUSTOM",
        splits: expenseData.splits
      };

      const res2 = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!res2.ok) {
        const err = await res2.json();
        throw new Error(err.message || "Failed to add expense");
      }

      const newExpense = await res2.json();
      // Refresh expenses
      fetchExpenses(currentGroup.groupId || (currentGroup.PK && currentGroup.PK.split("#")[1]));
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Error adding expense: " + error.message);
    }
  };

  useEffect(() => {
    // Initial fetch of groups is handled after login by Authenticator? 
    // We can just fetch if we have a user.
    // fetchGroups(); call moved to inside Authenticator wrapper handling
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
    fetchGroups(); // Refresh
  };

  // Dummy users for the dropdown (since we don't have GetGroupMembers)
  // We'll include the current user + some friends
  const dummyUsers = [
    { id: "user1", name: "Me (You)" },
    { id: "user2", name: "Alice" },
    { id: "user3", name: "Bob" },
    { id: "user4", name: "Charlie" }
  ];

  return (
    <Authenticator>
      {({ signOut, user }) => {
        // Fetch groups once on mount if empty?
        useEffect(() => {
          if (groups.length === 0) fetchGroups();
        }, []);

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
      }}
    </Authenticator>
  );
}

export default App;
