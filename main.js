const Apify = require('apify');
const ApifyClient = require('apify-client');
const typeCheck = require('type-check').typeCheck

const apifyClient = new ApifyClient({
  userId: process.env.APIFY_USER_ID,
  token: process.env.APIFY_TOKEN
});

const INPUT_TYPE = `{
    delete: Maybe Boolean,
    copy: Maybe Boolean,
    inputStore: String,
    outputStore: Maybe String,
    keys: Maybe [String],
    selectAll: Maybe Boolean,
    contentType: Maybe String,
    searchPrefix: Maybe String,
    searchPostfix: Maybe String,
    inputPrefix: Maybe String,
    inputPostfix: Maybe String,
    outputPrefix: Maybe String,
    outputPostfix: Maybe String
}`;

const keyValueStores = apifyClient.keyValueStores;

async function loadAllKeys(inputStore, keys, exclusiveStartKey){
       const limit = 1000
       const keysInput = await keyValueStores.listKeys({
            storeId: inputStore,
            limit,
            exclusiveStartKey: exclusiveStartKey
        })
        if(!keys){
            keys = []
        }
        keys = keys.concat(keysInput.items)
        if(keysInput.items.length < limit){
            return keys
        }
        else{
            return await loadAllKeys(inputStore, keys, keysInput.nextExclusiveStartKey)
        }
   }
   
async function copyRecords({keys, inputStore, inputPrefix, inputPostfix, outputPrefix, outputPostfix, contentType}){
    for(let key of keys){
        
        if(!outputPrefix) outputPrefix = '' 
        if(!outputPostfix) outputPostfix = ''
        if(!inputPrefix) inputPrefix = '' 
        if(!inputPostfix) inputPostfix = ''
        
        console.log('GETTING KEY: '+key)
        const recordKey = inputPrefix+key+inputPostfix
        console.log('RECORD KEY: '+recordKey)
        
        const record  = await keyValueStores.getRecord({ key : recordKey, storeId: inputStore});
        if(!record){
            throw new Error('specified key not found: '+key)
        }
        
        const outputKey = outputPrefix+key+outputPostfix
        console.log('OUTPUT KEY: '+outputKey)
        await keyValueStores.putRecord({
            key: outputKey,
            contentType,
            body: JSON.stringify(record.body)
        })
    }
}

async function deleteRecords (keys, inputStore){
    for(let key of keys){
        console.log('DELETING KEY: '+key)
        await keyValueStores.deleteRecord({
            storeId:inputStore,
            key: key
        })
    }
}

Apify.main(async () => {
    // Get input of your act
    const input = await Apify.getValue('INPUT');
    
    if (!typeCheck(INPUT_TYPE, input)) {
        console.log('Expected input:');
        console.log(INPUT_TYPE);
        console.log('Received input:');
        console.dir(input);
        throw new Error("Received invalid input");
    }
    
    const contentType = input.contentType? input.contentType: 'application/json; charset=utf-8'

    let store;
    if(input.outputStore){
        store = await keyValueStores.getStore({ storeId: input.outputStore});
        if(!store){
            store = await keyValueStores.getOrCreateStore({storeName: input.outputStore})
        }
        apifyClient.setOptions({ storeId: store.id });
    }
    
    
    if(input.keys && input.keys.length > 0){
        console.log('STARTING EXACT VERSION')
        if(input.copy){
            console.log('STARTING COPY')
            await copyRecords({
                keys: input.keys, inputStore: input.inputStore, 
                inputPrefix: input.inputPrefix, inputPostfix: input.inputPostfix, outputPrefix:input.outputPrefix,
                outputPostfix: input.outputPostfix, contentType})
        }
        if(input.delete){
            console.log('STARTING DELETE')
            await deleteRecords(input.keys, input.inputStore, store.id)
        }
    }
    if(input.searchPrefix || input.searchPostfix || input.selectAll){
        console.log('STARING SEARCH VERSION')
        searchPrefix = input.searchPrefix
        searchPostfix = input.searchPostfix
        const allKeys = await loadAllKeys(input.inputStore)
        const filteredKeys = allKeys.reduce((newArr,recordKey) => {
           if(input.selectAll){
                return newArr.concat(recordKey.key)
           }
           if(searchPrefix && !searchPostfix &&recordKey.key.substring(0, searchPrefix.length) === searchPrefix){
               return newArr.concat(recordKey.key)
           }
           if(!searchPrefix && searchPostfix &&recordKey.key.slice(-searchPostfix.length) === searchPostfix){
               return newArr.concat(recordKey.key)
           }
           if(searchPrefix && searchPostfix && recordKey.key.substring(0, searchPrefix.length) === searchPrefix && recordKey.key.slice(-searchPostfix.length) === searchPostfix ){
               return newArr.concat(recordKey.key)
           }
           return newArr
        },[])
        if(input.copy){
            console.log('STARTING COPY')
            await copyRecords({keys: filteredKeys, inputStore: input.inputStore,  outputPrefix: input.outputPrefix, outputPostfix: input.outputPostfix, contentType})
        }
        if(input.delete){
            console.log('STARTING DELETE')
            await deleteRecords(filteredKeys, input.inputStore)
        }  
    }  
});