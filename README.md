# store-manipulation

Apify utility act that allows you to manipulate records in key-value store. Currently it has those abilities:

* Copy records
* Delete records
* You can specify each record key yourself and/or use search patterns
* You can append a string to outputed record keys.

There are two main ways to get records that should be manipulated. You can combine both of those.
* Add "keys" property to input. Act will get records under those keys. You can also add "inputPrefix" and/or "inputPostfix" properties, then act will find just your keys with those added strings. For more information, look at examples. Passing empty array or not passing those properties at all just skips this type of search.

* Add "searchPrefix" and/or "searchPostfix" properties. Act will get all record keys starting and ending with those strings. If both are specified, act gets only record key that match both. Passing empty string or not passing those properties at all just skips this type of search.

**INPUT**

Input is an `application/json` object with the following properties:

```javascript
{
    // The only mandatory property. It is store id of store from which records will be manipulated (copied, deleted etc.). Passing non-existing id will throw an error.
    inputStore: String,

    // Property specifing if found records from input store will be deleted (after other actions are finished). Be very careful with your settings when setting this to true, double check everything. Default value is false.
    delete: Maybe Boolean,

    // Property specifing if found records from input store will be copied to output store. If copy is true and output store is not specified, act throws an error. Default value is false.
    copy: Maybe Boolean,
    
    // outputStore can be either store id or store name (only if it is on your account). If this propery doesn't match any id or name, act will create a store with given string and use it as output store.
    outputStore: Maybe String,

    // Array of string keys to specify which exact record keys you want to be manipulated. See also inputPrefix and inputPostfix properties.
    keys: Maybe [String],

    // If true, act gets all records from input store to be manipulated. Be very careful with this option. Default is false.
    selectAll: Maybe Boolean,

    // Content type of the records that will be copied to output store. Default is application/json.
    contentType: Maybe String,

    // If this string if provided, act will get all records starting with this string and manipulating with them. Empty string is the same as not using this option at all.
    searchPrefix: Maybe String,

    // If this string if provided, act will get all records ending with this string and manipulating with them. Empty string is the same as not using this option at all.
    searchPostfix: Maybe String,

    // This option only works when specifing exact keys with "keys" array property. Act gets records from "keys" array that have this string inserted.
    inputPrefix: Maybe String,

    // This option only works when specifing exact keys with "keys" array property. Act gets records from "keys" array that have this string appended.
    inputPostfix: Maybe String,

    // When copying records to output store, you can specify this string that will be inserted to stored record key.
    outputPrefix: Maybe String,

    // When copying records to output store, you can specify this string that will be appended to stored record key.
    outputPostfix: Maybe String
}
```

Example input:

```javascript
{ 
"inputStore": "KP5XNqliR5FrG4zCy",
"delete":true,
"copy": true,
"outputStore": "TEST-ACT",
"keys": ["my-record", "my-other-record"],
"selectAll": false,
"contentType":"",
"inputPrefix":"",
"inputPostfix": "-data",
"outputPrefix":"result-",
"outputPostfix": "",
"searchPrefix": "images-",
"searchPostfix": "-urls" 
}
```

This example act will first check if "inputStore" exists. Then it tries to find "outputStore" as id. Id is not found so it tries to find it by name, which is also not found so it creates store named "TEST-ACT" as sets it as outputStore. Then it searches keys "my-record-data" and "my-other-record-data", copies them to output store as "result-my-record" and "result-my-other-record". After records are copied, it deletes them from input store. Then it searches for every record key beggining with "images-" and ending with "-urls", for example "images-beach-urls", "images-hotel-urls" etc. and do the same with them as the first search.