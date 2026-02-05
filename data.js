// data.js
// Implements the "One Row Per User" architecture requested by the user.

export class DataManager {
    constructor() {
        this.room = new WebsimSocket();
        this.collectionName = 'open_skill_users_v1';
        this.currentUser = null;
        this.userRecord = null;
        this.allUsers = [];
        this.subscribers = [];
    }

    async init() {
        this.currentUser = await window.websim.getCurrentUser();
        
        // Subscribe to changes in the user collection (global state)
        this.room.collection(this.collectionName).subscribe((records) => {
            this.allUsers = records;
            // Update local user record ref if it exists
            if (this.userRecord) {
                const updatedMe = records.find(r => r.username === this.currentUser.username);
                if (updatedMe) this.userRecord = updatedMe;
            }
            this.notifySubscribers();
        });

        // Initial Fetch
        const records = await this.room.collection(this.collectionName).getList();
        this.allUsers = records;
        
        // Find or Create User Record
        let myRecord = records.find(r => r.username === this.currentUser.username);
        
        if (!myRecord) {
            // Initialize the 10 columns as empty JSON objects
            myRecord = await this.room.collection(this.collectionName).create({
                col1: { type: 'profile', bio: "Ready to contribute.", focus_capacity: 100 },
                col2: { type: 'skills', items: [] },
                col3: { type: 'contributions', items: [] },
                col4: { type: 'wallet', balance: 1000, history: [] }, // Giving everyone 1000 starter credits
                col5: { type: 'notifications', items: [] },
                col6: { type: 'settings', theme: 'dark' },
                col7: { type: 'reputation', score: 0, badges: [] },
                col8: { type: 'inbox', messages: [] },
                col9: { type: 'activity_log', logs: [] },
                col10: { type: 'metadata', last_active: new Date().toISOString() }
            });
        }
        this.userRecord = myRecord;
        this.notifySubscribers();
    }

    subscribe(callback) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    notifySubscribers() {
        this.subscribers.forEach(cb => cb(this.getData()));
    }

    getData() {
        return {
            me: this.userRecord,
            allUsers: this.allUsers,
            currentUser: this.currentUser
        };
    }

    // --- Semantic Helpers for the 10 Columns ---

    async updateProfile(data) {
        if (!this.userRecord) return;
        const col1 = { ...this.userRecord.col1, ...data };
        await this.room.collection(this.collectionName).update(this.userRecord.id, { col1 });
    }

    async addSkill(skillData) {
        if (!this.userRecord) return;
        const currentSkills = this.userRecord.col2.items || [];
        const newSkill = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            ...skillData,
            focus_pool: 0,
            maintainers: [this.currentUser.username],
            status: 'active'
        };
        const col2 = { ...this.userRecord.col2, items: [newSkill, ...currentSkills] };
        await this.room.collection(this.collectionName).update(this.userRecord.id, { col2 });
        return newSkill;
    }

    async updateSkill(skillId, updates) {
        if (!this.userRecord) return;
        const currentSkills = this.userRecord.col2.items || [];
        const index = currentSkills.findIndex(s => s.id === skillId);
        if (index !== -1) {
            currentSkills[index] = { ...currentSkills[index], ...updates };
            const col2 = { ...this.userRecord.col2, items: currentSkills };
            await this.room.collection(this.collectionName).update(this.userRecord.id, { col2 });
        }
    }

    async tipSkill(targetUsername, skillId, amount) {
        // This is tricky with 1-row-per-user because we need to update ANOTHER user's row.
        // Websim allows updating any record currently (per standard config), or we might be restricted.
        // Assuming we can update other records for this simulation since we are the "Platform".
        
        // 1. Deduct from self
        if (!this.userRecord) return;
        const myWallet = this.userRecord.col4;
        if (myWallet.balance < amount) throw new Error("Insufficient funds");
        
        myWallet.balance -= amount;
        myWallet.history.push({ type: 'debit', amount, reason: `Tip for ${skillId}`, date: new Date().toISOString() });
        
        await this.room.collection(this.collectionName).update(this.userRecord.id, { col4: myWallet });

        // 2. Add to target user (and update skill focus)
        const targetRecord = this.allUsers.find(u => u.username === targetUsername);
        if (targetRecord) {
            // Update their wallet
            const theirWallet = targetRecord.col4 || { balance: 0, history: [] };
            theirWallet.balance += amount; // Simplified: sending direct to user for now, skipping distribution logic complex math for MVP
            theirWallet.history.push({ type: 'credit', amount, reason: `Tip received for ${skillId}`, date: new Date().toISOString() });

            // Update their skill focus meter
            const theirSkills = targetRecord.col2 || { items: [] };
            const skillIndex = theirSkills.items.findIndex(s => s.id === skillId);
            if (skillIndex !== -1) {
                theirSkills.items[skillIndex].focus_pool = (theirSkills.items[skillIndex].focus_pool || 0) + amount;
            }

            // Update Notifications
            const theirNotifs = targetRecord.col5 || { items: [] };
            theirNotifs.items.unshift({
                id: crypto.randomUUID(),
                msg: `You received a $${amount} tip for skill ${skillId}`,
                read: false,
                date: new Date().toISOString()
            });

            // Perform the update on their record
            await this.room.collection(this.collectionName).update(targetRecord.id, {
                col4: theirWallet,
                col2: theirSkills,
                col5: theirNotifs
            });
        }
    }

    getAllSkills() {
        // Aggregates skills from ALL users
        let allSkills = [];
        this.allUsers.forEach(user => {
            if (user.col2 && user.col2.items) {
                user.col2.items.forEach(skill => {
                    allSkills.push({
                        ...skill,
                        author: user.username,
                        authorAvatar: `https://images.websim.com/avatar/${user.username}`
                    });
                });
            }
        });
        return allSkills.sort((a, b) => b.focus_pool - a.focus_pool); // Hot skills first
    }
}