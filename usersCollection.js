const { MongoClient } = require('mongodb');

/**
 * This script creates 3 new users in the users collection in the sample_airbnb database.
 * The users collection does not need to exist before running this script.
 * This script also creates a unique index on the email field in the users collection.
 * 
 * You will see "duplicate key" errors if you attempt to run this script more than once 
 * without dropping the documents in the users collection, because the unique index will 
 * not allow you to insert more than one document into the collection with the same email address.
 */

async function main() {
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/drivers/node/ for more details
     */
    const uri = "mongodb+srv://<username>:<password>@<your-cluster-url>/sample_airbnb?retryWrites=true&w=majority";

    /**
     * The Mongo Client you will use to interact with your database
     * See https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html for more details
     */
    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB cluster
        await client.connect();

        // Make the appropriate DB calls

        // Create 3 new users in the users collection
        await createMultipleUsers(client, [
            {
                email: "leslie@example.com",
                name: "Leslie Yepp"
            },
            {
                email: "april@example.com",
                name: "April Ludfence"
            },
            {
                email: "tom@example.com",
                name: "Tom Haverdodge"
            }
        ]);

        // Create a unique index on the email field in the users collection.
        // Note that if you run this script when you already have duplicate emails in the user collection, 
        // MongoDB will be unable to create the unique index.
        const createIndexResults = await client.db("sample_airbnb").collection("users").createIndex({ "email": 1 }, { unique: true });
        console.log(`Index successfully created: ${createIndexResults}`);

    } finally {
        // Close the connection to the MongoDB cluster
        await client.close();
    }
}

main().catch(console.error);

/**
 * Create multiple users
 * @param {MongoClient} client A MongoClient that is connected to a cluster with the sample_airbnb database
 * @param {Object[]} newUsers The new users to be added
 */
async function createMultipleUsers(client, newUsers) {
    // See http://bit.ly/Node_InsertMany for the insertMany() docs
    const result = await client.db("sample_airbnb").collection("users").insertMany(newUsers);

    console.log(`${result.insertedCount} new user(s) created with the following id(s):`);
    console.log(result.insertedIds);
}
