const { MongoClient } = require('mongodb');

async function main() {
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See http://bit.ly/NodeDocs_lauren for more details
     */
    const uri = "mongodb+srv://<username>:<password>@<your-cluster-url>/sample_airbnb?retryWrites=true&w=majority";
    
    /**
     * The Mongo Client you will use to interact with your database
     * See bit.ly/Node_MongoClient for more details
     */
    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB cluster
        await client.connect();

        // Make the appropriate DB calls

    } finally {
        // Close the connection to the MongoDB cluster
        await client.close();
    }
}

main().catch(console.error);

// Add functions that make DB calls here
