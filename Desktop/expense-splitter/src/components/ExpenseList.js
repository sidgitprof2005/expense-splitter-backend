import React from "react";

function ExpenseList({ expenses }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2>Expenses</h2>
      {expenses.length === 0 ? (
        <p>No expenses yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {expenses.map((ex, i) => (
            <li
              key={i}
              style={{
                marginBottom: 10,
                padding: 10,
                border: "1px solid #ddd",
                borderRadius: 6,
                background: "#fafafa",
              }}
            >
              <strong>{ex.paidBy}</strong> paid ₹{ex.amount} for{" "}
              <em>{ex.description}</em>
              {ex.splits && (
                <div style={{ marginTop: 5, fontSize: "0.9em", color: "#555" }}>
                  <strong>Split:</strong>
                  <ul style={{ margin: "5px 0 0 15px" }}>
                    {Object.entries(ex.splits).map(([user, share]) => (
                      <li key={user}>
                        {user}: ₹{share.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ExpenseList;
