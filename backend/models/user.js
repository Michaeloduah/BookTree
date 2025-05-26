const { MongoClient, ObjectId } = require('mongodb');

const uri = 'your_mongodb_connection_string';
const client = new MongoClient(uri);
const dbName = 'your_database_name';

async function getUserCollection() {
    if (!client.topology || !client.topology.isConnected()) {
        await client.connect();
    }
    return client.db(dbName).collection('users');
}

class User {
    constructor({ name, email, password, _id }) {
        this.name = name;
        this.email = email;
        this.password = password;
        if (_id) this._id = _id;
    }

    static async create(userData) {
        const collection = await getUserCollection();
        const result = await collection.insertOne(userData);
        return new User({ ...userData, _id: result.insertedId });
    }

    static async findByEmail(email) {
        const collection = await getUserCollection();
        const user = await collection.findOne({ email });
        return user ? new User(user) : null;
    }

    static async findById(id) {
        const collection = await getUserCollection();
        const user = await collection.findOne({ _id: new ObjectId(id) });
        return user ? new User(user) : null;
    }
}

module.exports = User;