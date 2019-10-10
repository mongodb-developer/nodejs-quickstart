const {MongoClient} = require('mongodb');

async function main(){
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
     */
    const uri = "mongodb+srv://<username>:<password>@<your-cluster-url>/test?retryWrites=true&w=majority";

    /**
     * The Mongo Client you will use to interact with your database
     * See https://mongodb.github.io/node-mongodb-native/3.3/api/MongoClient.html for more details
     */
    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB cluster
        await client.connect();

        // Access the listingsAndReviews collection that is stored in the sample_airbnb DB
        let collection = client.db("sample_airbnb").collection("listingsAndReviews");

        // Make the appropriate DB calls
        await printFiveListings(collection);

    } catch (e) {
        console.error(e);
    } finally {
        // Close the connection to the MongoDB cluster
        await client.close();
    }
}

main().catch(console.err);

/**
 * Print the names of five Airbnb listings
 * @param {Collection} collection The collection to search
 */
async function printFiveListings(collection){
    let cursor = await collection.find({}).limit(5);
    let docs = await cursor.toArray();

    console.log("Found Airbnb listings in the database:");
    docs.forEach(doc => console.log(` - ${doc.name}`));
};
