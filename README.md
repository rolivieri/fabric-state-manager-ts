[![Build Status - Master](https://travis-ci.org/rolivieri/fabric-state-manager-ts.svg?branch=master)](https://travis-ci.org/rolivieri/fabric-state-manager-ts/builds)

# fabric-state-manager-ts

This repository contains a reusable chaincode component, `RemoverCC`, for deleting the records found under a list of namespaces (i.e. composite keys). Thus, this chaincode component can be used to wipe out the world state. The `RemoverCC` chaincode component, written in [TypeScript](https://www.typescriptlang.org/), exposes the following methods:

 - DeleteState - Deletes all records found under the namespaces that are passed in to the `Init()` method.

Though more than likely you won't be resetting the world state in a production environment, doing so in a development, test, or staging environment or as part of a PoC application is more than common.

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
total 384
drwxr-xr-x   17 olivieri  staff     544 Jun 17 16:40 .
drwxr-xr-x   60 olivieri  staff    1920 Jun 14 15:01 ..
drwxr-xr-x   13 olivieri  staff     416 Jun 17 16:51 .git
-rw-r--r--    1 olivieri  staff    1155 Jun 14 15:01 .gitignore
-rw-r--r--    1 olivieri  staff     264 Jun 14 15:01 .npmignore
drwxr-xr-x    6 olivieri  staff     192 Jun 17 16:40 .nyc_output
-rw-r--r--    1 olivieri  staff     130 Jun 14 15:01 .travis.yml
-rw-r--r--    1 olivieri  staff   11357 Jun 14 15:01 LICENSE
-rw-r--r--    1 olivieri  staff   13742 Jun 17 16:51 README.md
drwxr-xr-x    6 olivieri  staff     192 Jun 14 15:07 coverage
-rw-r--r--    1 olivieri  staff     324 Jun 14 15:01 deploy_config.json
drwxr-xr-x  243 olivieri  staff    7776 Jun 17 16:40 node_modules
-rw-r--r--    1 olivieri  staff  138374 Jun 17 16:39 package-lock.json
-rw-r--r--    1 olivieri  staff    1884 Jun 17 16:39 package.json
drwxr-xr-x    5 olivieri  staff     160 Jun 16 12:28 src
-rw-r--r--    1 olivieri  staff     355 Jun 14 15:01 tsconfig.json
-rw-r--r--    1 olivieri  staff     513 Jun 14 15:01 tslint.json
$ npm install

...

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

1. Use composition (or inheritance)) to extend the capabilities of your code by referencing the `RemoverCC` structure (which resides in the `fabric-state-manager` package you just imported) in your chaincode component. In this example, we'll use composition:
    
    ```
    type SampleChaincodeCC struct {      

        ...

        //Using inheritance in this sample
        sm.RemoverCC

        ...    
    }
    ```

2. From the `Init()` method in your chaincode component, invoke the `Initialize(...)` method. The invocation to the `Initialize()` method from your chaincode should pass an array of strings that contains the namespaces whose data should be deleted from the world state.  Ex:

    ```
    // Init initializes chaincode
    func (t *SampleChaincodeCC) Init(stub shim.ChaincodeStubInterface) pb.Response {
	
        ...

        namespaces := []string{"namespace1", "namespace2", ... "namespaceN"}			
        t.Initialize(namespaces)

        ...

        return shim.Success(nil)
    }
    ```

3. Add the `DeleteState(...)` method to the `Invoke()` method of your chaincode component.  Ex:

    ```
    // Invoke - Entry point for Invocations
    func (t *StakeholdersChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
        function, args := stub.GetFunctionAndParameters()

        switch function {
            case "Function1":
                return t.Function1(stub, args)
            case "Function2":
                return t.Function2(stub, args)
            
            ...

            case "DeleteState":		
                return t.DeleteState(stub)
            
            ...
        }

        ...

    }
    ```

4. Whenever there is the need to reset the world state, your Fabric client application should call the `DeleteState()` method which will then read the namespaces provided to the `Initialize()` method; the invocation of the `DeleteState()` method will result in the deletion of all the records found under those namespaces.
