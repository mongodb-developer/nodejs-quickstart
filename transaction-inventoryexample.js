const { MongoClient } = require('mongodb');

// In MongoDB 4.2 and earlier, CRUD operations in transactions must be on existing collections 
// See https://docs.mongodb.com/manual/core/transactions/#transactions-api for more information

// Before running this script...
//   1. Create a database named 'book-store'
//   2. Create a collection named 'orders' in the database
//   3. Create a collection named 'inventory' in the database
//   3. Create a document in the 'inventory' collection:
//         { "_id": "parks-rec-book", "name": "The Ultimate Parks and Rec Book for the Ultimate Fans", "numberInStock": 5 }
//   4: Optional: Add schema validation to the 'inventory' collection to ensure the number of items in stock cannot drop below 0.
//      See https://docs.mongodb.com/manual/core/schema-validation/ for details on how to 
//      enable schema validation. Configuring schema validation in MongoDB Compass is an
//      easy way to add schema validation to an existing database: https://docs.mongodb.com/compass/current/validation/
//
//      {
//        $jsonSchema: {
//          properties: {
//            numberInStock: {
//              minimum: 0,
//              description: 'numberInStock cannot be negative'
//            }
//          }
//        }
//      }

async function main() {
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/drivers/node/ for more details
     */
    const uri = "mongodb+srv://<username>:<password>@<your-cluster-url>/book-store?retryWrites=true&w=majority";

    /**
     * The Mongo Client you will use to interact with your database
     * See https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html for more details
     */
    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB cluster
        await client.connect();

        // User1 purchases 1 copy of parks-rec-book
        await purchaseBook(client, "User1", "parks-rec-book", 1, "paid");

    } finally {
        // Close the connection to the MongoDB cluster
        await client.close();
    }
}

main().catch(console.error);

/**
 * Purchase a book
 * @param {MongoClient} client A MongoClient that is connected to a cluster with the book-store database
 * @param {String} userId The _id of the user who is purchasing the book
 * @param {String} bookId The _id of the book being purchased
 * @param {Number} quantity The number of copies being purchased
 * @param {String} status The order status
 */
async function purchaseBook(client, userId, bookId, quantity, status) {

    /**
     * The orders collection in the book-store database
     */
    const ordersCollection = client.db("book-store").collection("orders");

    /**
     * The inventory collection in the book-store database
     */
     const inventoryCollection = client.db("book-store").collection("inventory");

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

            // Update the inventory to reflect the book has been sold
            const updateInventoryResults = await inventoryCollection.updateOne(
                { _id: bookId },
                { $inc: { numberInStock: quantity * -1 } },
                { session });
            console.log(`${updateInventoryResults.matchedCount} document(s) found in the inventory collection with _id ${bookId}.`);
            console.log(`${updateInventoryResults.modifiedCount} document(s) was/were updated.`);
            if (updateInventoryResults.modifiedCount !== 1) {
                await session.abortTransaction();
                return;
            }

            // Record the order in the orders collection
            const insertOrderResults = await ordersCollection.insertOne(
                { "userId": userId , bookId: bookId, quantity: quantity, status: status },
                { session });
            console.log(`New order recorded with the following id: ${insertOrderResults.insertedId}`);

        }, transactionOptions);

        if (transactionResults) {
            console.log("The order was successfully processed. Database operations from the transaction are now visible outside the transaction.");
        } else {
            console.log("The order was not successful. The transaction was intentionally aborted.");
        }
    } catch (e) {
        console.log("The order was not successful. The transaction was aborted due to an unexpected error: " + e);
    } finally {
        // Step 4: End the session
        await session.endSession();
    }

}
