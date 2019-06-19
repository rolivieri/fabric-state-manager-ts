/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ChaincodeMockStub } from '@theledger/fabric-mock-stub';
import * as chai from 'chai';
import { RemoverCC } from '..';

const assert = chai.assert;

describe('RemoverContract', () => {
    let mockStub: ChaincodeMockStub;
    let chaincode: RemoverCC;
    let namespaces: string[];
    const TxID = 'mockTxID';

    beforeEach(() => {
        namespaces = ['namespace1', 'namespace2', 'namespace3'];
        chaincode = new RemoverCC();
        mockStub = new ChaincodeMockStub('RemoverCCStub', chaincode);
    });

    describe('#Ping', () => {
        it('should ping successfully', async () => {
            await mockStub.mockInit(TxID, namespaces);
            const result = await mockStub.mockInvoke(TxID, ['Ping']);
            assert.equal(result.status, 200);
            assert.equal(result.payload.toString(), 'Ping to chaincode successful.');
        });
    });

    describe('#No namespaces provided', () => {
        it('should fail', async () => {
            const result = await mockStub.mockInit(TxID, []);
            assert.equal(result.status, 500);
            assert.equal(result.message.toString(), 'No namespaces provided to the Init() method.');
        });
    });

    describe('#Unknown Method', () => {
        it('should fail', async () => {
            await mockStub.mockInit(TxID, namespaces);
            const result = await mockStub.mockInvoke(TxID, ['Unknown']);
            assert.equal(result.status, 500);
        });
    });

    describe('#DeleteState', () => {
        it('should delete the records from namespaces', async () => {
            // Init chaincode
            await mockStub.mockInit(TxID, namespaces);
            // Define dummy record
            const dummyRecord = '{"id": "{0}", "Company Code": "IBM"}';
            const numberOfRecordsPerNamespace = 10;
            // const numberOfRecordsPerNamespace = 1;
            // Store dummy data into world state
            for (let id = 0; id < numberOfRecordsPerNamespace; id++) {
                const recordID = id.toString();
                const record = dummyRecord.replace('{0}', recordID);
                const recordAsBytes = Buffer.from(record);
                for (const namespace of namespaces) {
                    const recordCompositeKey = mockStub.createCompositeKey(namespace, [recordID]);
                    // console.log('About to insert dummy record: "' + record + '" into namespace: "' + namespace + '".');
                    // Need a dummy transaction before we can call the stub.PutState() method
                    mockStub.mockTransactionStart(TxID);
                    await mockStub.putState(recordCompositeKey, recordAsBytes);
                    // Insert additional data but using this time a non-composite key (these records should not be deleted)
                    await mockStub.putState(recordID, recordAsBytes);
                    mockStub.mockTransactionEnd(TxID);
                    // const t = await mockStub.getState(recordCompositeKey);
                    // console.log('Inserted dummy record into namespace.');
                }
            }

            // Now we are ready to test our API to ensure it can delete records as expected
            const result = await mockStub.mockInvoke(TxID, ['DeleteState']);
            const actualNumberOfRecordsDeleted = result.payload.toString();
            console.log('Number of records deleted: ' + actualNumberOfRecordsDeleted);

            for (let id = 0; id < numberOfRecordsPerNamespace; id++) {
                const recordID = id.toString();
                // Create composite key using namespace (prefix) for record
                for (const namespace of namespaces) {
                    const recordCompositeKey = mockStub.createCompositeKey(namespace, [recordID]);
                    // Try to get data directly from world state (there should be none)
                    // Record should not exist
                    const recordAsBytesByCompositeKey = mockStub.state[recordCompositeKey];
                    assert.isUndefined(recordAsBytesByCompositeKey);
                    // Record should exist
                    const recordAsBytesBySimpleKey = mockStub.state[recordID];
                    assert.isNotNull(recordAsBytesBySimpleKey);
                }
            }

            const expectedNumberOfRecordsDeleted = numberOfRecordsPerNamespace * namespaces.length;
            console.log('Summary: Expected number of deleted records = ' + expectedNumberOfRecordsDeleted + ', actual number of deleted records from chain = ' + actualNumberOfRecordsDeleted + '.');
            assert.equal(expectedNumberOfRecordsDeleted.toString(), actualNumberOfRecordsDeleted, 'Number of deleted records does NOT match.');
        });
    });
});
