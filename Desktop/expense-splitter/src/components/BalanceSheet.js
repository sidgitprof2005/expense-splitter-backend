import React from "react";

function BalanceSheet({ users, expenses, onReminder }) {
  let balance = {};
  users.forEach((u) => (balance[u.name] = 0));

  expenses.forEach((ex) => {
    if (ex.splits) {
      // Custom or equal splits saved in expense
      users.forEach((u) => {
        const share = ex.splits[u.name] || 0;
        if (u.name === ex.paidBy) {
          balance[u.name] += ex.amount - share;
        } else {
          balance[u.name] -= share;
        }
      });
    } else {
      // Fallback to equal split
      let share = ex.amount / users.length;
      users.forEach((u) => {
        if (u.name === ex.paidBy) {
          balance[u.name] += ex.amount - share;
        } else {
          balance[u.name] -= share;
        }
      });
    }
  });

  return (
    <div style={{ marginTop: 20, padding: 15, border: "1px solid #ddd", borderRadius: 8, background: "#fefefe" }}>
      <h2 style={{ marginBottom: 10 }}>Balance Sheet</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {users.map((u) => (
          <li
            key={u.id}
            style={{
              padding: "8px 0",
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: balance[u.name] >= 0 ? "green" : "red",
              fontWeight: "500",
            }}
          >
            <span>
              {u.name}:{" "}
              {balance[u.name] > 0
                ? `Should Receive ₹${balance[u.name].toFixed(2)}`
                : balance[u.name] < 0
                ? `Owes ₹${Math.abs(balance[u.name]).toFixed(2)}`
                : "Settled Up ✅"}
            </span>
            {balance[u.name] < 0 && onReminder && (
              <button
                onClick={() => onReminder(u.name, Math.abs(balance[u.name]))}
                style={{
                  marginLeft: 10,
                  padding: "4px 8px",
                  background: "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Send Reminder
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BalanceSheet;
