const { MongoClient } = require('mongodb');

// In MongoDB 4.2 and earlier, CRUD operations in transactions must be on existing collections 
// See https://docs.mongodb.com/manual/core/transactions/#transactions-api for more information

// Before running this script...
//   1. Create a database named 'banking'
//   2. Create a collection named 'accounts' in the database
//   3. Create two documents in the 'accounts' collection:
//         {"_id":"account1", "balance":500}
//         {"_id":"account2", "balance":0}
//   4: Optional: add schema validation to ensure an account balance cannot drop below 0.
//      See https://docs.mongodb.com/manual/core/schema-validation/ for details on how to 
//      enable schema validation. Configuring schema validation in MongoDB Compass is an
//      easy way to add schema validation to an existing database: https://docs.mongodb.com/compass/current/validation/
//
//      {
//        $jsonSchema: {
//          properties: {
//            balance: {
//              minimum: 0,
//              description: 'account balance cannot be negative'
//            }
//          }
//        }
//      }

async function main() {
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/drivers/node/ for more details
     */
    const uri = "mongodb+srv://<username>:<password>@<your-cluster-url>/banking?retryWrites=true&w=majority";

    /**
     * The Mongo Client you will use to interact with your database
     * See https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html for more details
     */
    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB cluster
        await client.connect();

        // Transfer $100 from "account1" to "account2"
        await transferMoney(client, "account1", "account2", 100);

    } finally {
        // Close the connection to the MongoDB cluster
        await client.close();
    }
}

main().catch(console.error);

/**
 * Transfer money from one bank account to another using
 * @param {MongoClient} client A MongoClient that is connected to a cluster with the banking database
 * @param {String} account1 The _id of the account where money should be subtracted
 * @param {String} account2 The _id of the account where money should be added
 * @param {Number} amount The amount of money to be transferred
 */
async function transferMoney(client, account1, account2, amount) {

    /**
     * The accounts collection in the banking database
     */
    const accountsCollection = client.db("banking").collection("accounts");

    // Step 1: Start a Client Session
    // See https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html#startSession for the startSession() docs
    const session = client.startSession();

    // Step 2: Optional. Define options for the transaction
    const transactionOptions = {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' }
    };

    try {
        // Step 3: Use withTransaction to start a transaction, execute the callback, and commit (or abort on error)
        // Note: The callback for withTransaction MUST be async and/or return a Promise.
        // See https://mongodb.github.io/node-mongodb-native/3.6/api/ClientSession.html#withTransaction for the withTransaction() docs        
        const transactionResults = await session.withTransaction(async () => {

            // Important:: You must pass the session to each of the operations   

            // Remove the money from the first account
            const subtractMoneyResults = await accountsCollection.updateOne(
                { _id: account1 },
                { $inc: { balance: amount * -1 } },
                { session });
            console.log(`${subtractMoneyResults.matchedCount} document(s) found in the accounts collection with _id ${account1}.`);
            console.log(`${subtractMoneyResults.modifiedCount} document(s) was/were updated to remove the money.`);
            if (subtractMoneyResults.modifiedCount !== 1) {
                await session.abortTransaction();
                return;
            }

            // Add the money to the second account
            const addMoneyResults = await accountsCollection.updateOne(
                { _id: account2 },
                { $inc: { balance: amount } },
                { session });
            console.log(`${addMoneyResults.matchedCount} document(s) found in the accounts collection with _id ${account2}.`);
            console.log(`${addMoneyResults.modifiedCount} document(s) was/were updated to add the money.`);
            if (addMoneyResults.modifiedCount !== 1) {
                await session.abortTransaction();
                return;
            }

        }, transactionOptions);

        if (transactionResults) {
            console.log("The money was successfully transferred. Database operations from the transaction are now visible outside the transaction.");
        } else {
            console.log("The money was not transferred. The transaction was intentionally aborted.");
        }
    } catch (e) {
        console.log("The money was not transferred. The transaction was aborted due to an unexpected error: " + e);
    } finally {
        // Step 4: End the session
        await session.endSession();
    }

}

