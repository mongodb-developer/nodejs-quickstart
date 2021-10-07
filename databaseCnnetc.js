const { MongoClient } = require('mongodb');

async function main(){
    const uri = "mongodb+srv://sidhi:sidhi@cluster0.uinua.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

    const client = new MongoClient(uri);

    try{
        await client.connect();

        await createListing(client, {
            name: "sidhi",
            summary: "nice",
            bedrooms: 6,
            bathrooms: 8
        });

    //     await creatMultipleListing(client, [{
    //         name: "sidhi",
    //         summary: "nice",
    //         bedrooms: 6,
    //         bathrooms: 8
    //     },
    //     {
    //         name: "aaa",
    //         summary: "nice",
    //         bedrooms: 4,
    //         bathrooms: 8
    //     }
    // ]);

    await findOneListByName(client, "sidhi")
    //await listDatabases(client);

    await findListingsWithMinimumBedroomsBathroomsAndMostRecentReviews(client, {
        minimumNumberOfBedrooms: 4,
        minimumNumberOfBathrooms: 2,
        maximumNumberOfResults: 5
    });
    }
    catch(e){
        console.log(e);
    }
    finally {
        await client.close();
    }
}

main().catch(console.error);

async function createListing(client, newListing) {
    const result = await client.db("sample_airbnb").collection("listingsAndReviews").insertOne(newListing);

    console.log(`New listing created with the following id: ${result.insertedId}`)
}

async function creatMultipleListing(client, newMultipleList){
    const result = await client.db("sample_airbnb").collection("listingsAndReviews").insertMany(newMultipleList);

    console.log(`${result.insertedCount} new listing created witht the following id(s:)`);
    console.log(result.insertedIds);

}

async function findOneListByName(client, nameOfListing){
    const result = await client.db("sample_airbnb").collection("listingsAndReviews").findOne({name: nameOfListing});
    if(result){
        console.log(`Found a listing in the collection with the name ${nameOfListing}`);
        console.log(result);

    } else {
        console.log("no listing found");
    }

}

async function findListingsWithMinimumBedroomsBathroomsAndMostRecentReviews(client, {
    minimumNumberOfBedrooms = 0,
    minimumNumberOfBathrooms = 0,
    maximumNumberOfResults = Number.MAX_SAFE_INTEGER
} = {}) {

    // See https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#find for the find() docs
    const cursor = client.db("sample_airbnb").collection("listingsAndReviews")
        .find({
            bedrooms: { $gte: minimumNumberOfBedrooms },
            bathrooms: { $gte: minimumNumberOfBathrooms }
        }
        )
        .sort({ last_review: -1 })
        .limit(maximumNumberOfResults);

    // Store the results in an array
    const results = await cursor.toArray();

    // Print the results
    if (results.length > 0) {
        console.log(`Found listing(s) with at least ${minimumNumberOfBedrooms} bedrooms and ${minimumNumberOfBathrooms} bathrooms:`);
        results.forEach((result, i) => {
            const date = new Date(result.last_review).toDateString();

            console.log();
            console.log(`${i + 1}. name: ${result.name}`);
            console.log(`   _id: ${result._id}`);
            console.log(`   bedrooms: ${result.bedrooms}`);
            console.log(`   bathrooms: ${result.bathrooms}`);
            console.log(`   most recent review date: ${date}`);
        });
    } else {
        console.log(`No listings found with at least ${minimumNumberOfBedrooms} bedrooms and ${minimumNumberOfBathrooms} bathrooms`);
    }
}

async function listDatabases(client){
    databasesList = await client.db().admin().listDatabases();
 
    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};
