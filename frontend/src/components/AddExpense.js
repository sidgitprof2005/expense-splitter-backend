import React, { useState } from "react";

function AddExpense({ users, addExpense }) {
  const [paidBy, setPaidBy] = useState(users[0].name);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [splitType, setSplitType] = useState("equal");
  const [customSplits, setCustomSplits] = useState(
    users.reduce((acc, u) => ({ ...acc, [u.name]: "" }), {})
  );

  const handleCustomChange = (name, value) => {
    setCustomSplits({ ...customSplits, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !desc) return;

    let splits = {};
    if (splitType === "equal") {
      const share = parseFloat(amount) / users.length;
      users.forEach((u) => {
        splits[u.name] = share;
      });
    } else {
      let total = 0;
      users.forEach((u) => {
        const val = parseFloat(customSplits[u.name]) || 0;
        splits[u.name] = val;
        total += val;
      });
      if (Math.abs(total - parseFloat(amount)) > 0.01) {
        alert("⚠️ Custom splits must add up to total amount!");
        return;
      }
    }

    addExpense({
      paidBy,
      amount: parseFloat(amount),
      description: desc,
      splits,
    });

    setAmount("");
    setDesc("");
    setCustomSplits(users.reduce((acc, u) => ({ ...acc, [u.name]: "" }), {}));
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
      <h2>Add Expense</h2>
      <input
        type="text"
        placeholder="Description"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        style={{ marginRight: 10 }}
        required
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ marginRight: 10 }}
        required
      />
      <select
        value={paidBy}
        onChange={(e) => setPaidBy(e.target.value)}
        style={{ marginRight: 10 }}
      >
        {users.map((u) => (
          <option key={u.id} value={u.name}>
            {u.name}
          </option>
        ))}
      </select>

      <div style={{ marginTop: 10, marginBottom: 10 }}>
        <label>
          <input
            type="radio"
            value="equal"
            checked={splitType === "equal"}
            onChange={() => setSplitType("equal")}
          />
          Equal Split
        </label>
        <label style={{ marginLeft: 15 }}>
          <input
            type="radio"
            value="custom"
            checked={splitType === "custom"}
            onChange={() => setSplitType("custom")}
          />
          Custom Split
        </label>
      </div>

      {splitType === "custom" && (
        <div style={{ marginBottom: 10 }}>
          {users.map((u) => (
            <div key={u.id} style={{ marginBottom: 5 }}>
              {u.name}:{" "}
              <input
                type="number"
                placeholder="Share"
                value={customSplits[u.name]}
                onChange={(e) => handleCustomChange(u.name, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      <button type="submit">Add</button>
    </form>
  );
}

export default AddExpense;