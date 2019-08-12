[![Build Status - Master](https://travis-ci.org/rolivieri/fabric-state-manager-ts.svg?branch=master)](https://travis-ci.org/rolivieri/fabric-state-manager-ts/builds)

# fabric-state-manager-ts

This repository contains a reusable chaincode component, `RemoverCC`, for deleting the records found under a list of namespaces (i.e. composite keys). Thus, this chaincode component can be used to wipe out the world state. The `RemoverCC` chaincode component, written in [TypeScript](https://www.typescriptlang.org/), exposes the following methods:

 - DeleteState - Deletes all records found under the namespaces that are passed in to the `Init()` method.

Though more than likely you won't be resetting the world state in a production environment, doing so in a development, test, or staging environment or as part of a PoC application is more than common.

Finally, please be aware that this code stores the namespace names (from which records should be deleted) in the blockchain under the `fabric-state-manager-ts` key. Therefore, please make sure you are **not** using this key to store any values on the blockchain.

## Compiling and running test cases

### Platform
It is strongly recommended to use **macOS** or a **Linux** flavor (such as Ubuntu) for building and testing the `RemoverCC` chaincode component.

### Prerequisites
1) Before you attempt to build and run the tests cases for `RemoverCC`, please make sure you have the necessary [pre-requisites](https://hyperledger-fabric.readthedocs.io/en/release-1.4/prereqs.html) on your system:

* Node.js (v8.x)

### Steps
1) Once you have cloned this repository to your local workstation, navigate to its root folder and execute the commands shown below to build and test the `RemoverCC` chaincode component:

```
$ pwd
/Users/olivieri/git/fabric-state-manager-ts
$ ls -la
total 368
drwxr-xr-x  14 olivieri  staff     448 Jun 17 17:09 .
drwxr-xr-x  60 olivieri  staff    1920 Jun 17 17:09 ..
drwxr-xr-x  13 olivieri  staff     416 Jun 17 17:09 .git
-rw-r--r--   1 olivieri  staff    1155 Jun 17 17:09 .gitignore
-rw-r--r--   1 olivieri  staff     264 Jun 17 17:09 .npmignore
-rw-r--r--   1 olivieri  staff     130 Jun 17 17:09 .travis.yml
-rw-r--r--   1 olivieri  staff   11357 Jun 17 17:09 LICENSE
-rw-r--r--   1 olivieri  staff    7581 Jun 17 17:09 README.md
-rw-r--r--   1 olivieri  staff     324 Jun 17 17:09 deploy_config.json
-rw-r--r--   1 olivieri  staff  138374 Jun 17 17:09 package-lock.json
-rw-r--r--   1 olivieri  staff    1884 Jun 17 17:09 package.json
drwxr-xr-x   5 olivieri  staff     160 Jun 17 17:09 src
-rw-r--r--   1 olivieri  staff     355 Jun 17 17:09 tsconfig.json
-rw-r--r--   1 olivieri  staff     513 Jun 17 17:09 tslint.json
$ npm install

...

added 403 packages from 1008 contributors and audited 1244 packages in 10.736s
found 0 vulnerabilities

$ npm run test

> RemoverCC@0.0.1 pretest /Users/olivieri/git/fabric-state-manager-ts
> npm run lint


> RemoverCC@0.0.1 lint /Users/olivieri/git/fabric-state-manager-ts
> tslint -c tslint.json 'src/**/*.ts'


> RemoverCC@0.0.1 test /Users/olivieri/git/fabric-state-manager-ts
> nyc mocha src/**/*.spec.ts



  RemoverContract
    #Ping
      ✓ should ping successfully
    #Unknown
      ✓ should fail
    #DeleteState
2019-06-17T20:54:34.365Z info [RemoverCC]                                         info: Deleting data for namespaces: namespace1,namespace2,namespace3 {"timestamp":"2019-06-17T20:54:34.365Z"}
2019-06-17T20:54:34.370Z info [RemoverCC]                                         info: Total number of records deleted: 30 {"timestamp":"2019-06-17T20:54:34.370Z"}
Number of records deleted: 30
Summary: Expected number of deleted records = 30, actual number of deleted records from chain = 30.
      ✓ should delete the records from namespaces


  3 passing (22ms)

---------------------|----------|----------|----------|----------|-------------------|
File                 |  % Stmts | % Branch |  % Funcs |  % Lines | Uncovered Line #s |
---------------------|----------|----------|----------|----------|-------------------|
All files            |      100 |     87.5 |      100 |      100 |                   |
 src                 |      100 |      100 |      100 |      100 |                   |
  index.ts           |      100 |      100 |      100 |      100 |                   |
 src/remover-cc      |      100 |     87.5 |      100 |      100 |                   |
  remover-cc.spec.ts |      100 |      100 |      100 |      100 |                   |
  remover-cc.ts      |      100 |     87.5 |      100 |      100 |                55 |
 src/util            |      100 |      100 |      100 |      100 |                   |
  logger.ts          |      100 |      100 |      100 |      100 |                   |
---------------------|----------|----------|----------|----------|-------------------|

=============================== Coverage summary ===============================
Statements   : 100% ( 100/100 )
Branches     : 87.5% ( 7/8 )
Functions    : 100% ( 16/16 )
Lines        : 100% ( 97/97 )
================================================================================
$  
```

## How to leverage this code from your chaincode component
### Development
Please remember that Hyperledger Fabric takes into account chaincode components when partitioning the data stored in a channel. In other words, a chaincode component won't be able to read and/or delete any state that has been saved by another chaincode component on the same channel. Because of this, you cannot just deploy this code as a chaincode component and expect it to have access to the data written by another chaincode. Therefore, to leverage the code in this repository, you can follow the following steps:

1. Configure your Node.js application to use this component; from the root folder of your application, execute the following command:

    ```
    npm i @blockchainlabs/fabric-state-manager --save
    ```

1. Use composition (or inheritance)) to extend the capabilities of your code by referencing the `RemoverCC` class (which resides in the `fabric-state-manager` module you just imported) in your chaincode component. In this example, we'll use composition:
    
    ```
    ...

    import { RemoverCC } from "@blockchainlabs/fabric-state-manager";

    ...

    export class SampleChaincodeCC implements ChaincodeInterface {

        ...

        private removerCC: RemoverCC;

        ...
        
    }
    ```

1. From the `Init()` method in your chaincode component, invoke the `Initialize(...)` method. The invocation of the `Initialize()` method from your chaincode should pass an array of strings that contains the namespaces whose data should be deleted from the world state. Ex:

    ```
    // Init initializes chaincode
    public async Init(stub: ChaincodeStub): Promise<ChaincodeResponse> {
        logger.debug('entering >>> Init');

        ...

        this.removerCC = new RemoverCC();
        const namespaces = ["namespace1", "namespace2", ... "namespaceN"];	
        await this.removerCC.Initialize(stub, namespaces);

        ...

        return Shim.success();
    }
    ```

1. Add the `DeleteState(...)` method to the `Invoke()` method of your chaincode component.  Ex:

    ```
    // Invoke - Entry point for Invocations
    public async Invoke(stub: ChaincodeStub): Promise<ChaincodeResponse> {
        logger.debug('entering >>> Invoke');
        const funcAndParams = stub.getFunctionAndParameters();
        switch (funcAndParams.fcn) {
            case 'Function1':
                return await this.Function1(stub);
            case 'Function2':
                return await this.Function2(stub);
            
            ...
            
            case 'DeleteState':
                return await this.removerCC.DeleteState(stub);

            ...
        }

        ...
       
    }
    ```

1. Whenever there is the need to reset the world state, your Fabric client application should call the `DeleteState()` method which will then read the namespaces provided to the `Initialize()` method; the invocation of the `DeleteState()` method will result in the deletion of all the records found under those namespaces.
