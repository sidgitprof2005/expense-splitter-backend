import React, { useState } from 'react';

function GroupList({ groups, onCreateGroup, onSelectGroup }) {
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newGroupName) return;
        onCreateGroup(newGroupName, newGroupDesc);
        setNewGroupName('');
        setNewGroupDesc('');
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h2>Your Groups</h2>

            {groups.length === 0 ? (
                <p>You haven't joined any groups yet.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {groups.map(group => (
                        <li
                            key={group.groupId}
                            onClick={() => onSelectGroup(group)}
                            style={{
                                padding: '15px',
                                border: '1px solid #ddd',
                                marginBottom: '10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                background: '#fff',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f9f9f9'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                        >
                            <h3 style={{ margin: '0 0 5px 0' }}>{group.groupName || group.name}</h3>
                            <p style={{ margin: 0, color: '#666' }}>{group.description}</p>
                        </li>
                    ))}
                </ul>
            )}

            <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '8px', background: '#f5f5f5' }}>
                <h3>Create New Group</h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            placeholder="Group Name"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            style={{ padding: '8px', width: '100%', boxSizing: 'border-box', marginBottom: '10px' }}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Description (optional)"
                            value={newGroupDesc}
                            onChange={(e) => setNewGroupDesc(e.target.value)}
                            style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                    <button
                        type="submit"
                        style={{
                            padding: '10px 20px',
                            background: '#2ecc71',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Create Group
                    </button>
                </form>
            </div>
        </div>
    );
}

export default GroupList;
