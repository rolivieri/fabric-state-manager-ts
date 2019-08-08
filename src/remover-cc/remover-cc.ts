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

import { ChaincodeInterface, ChaincodeResponse, ChaincodeStub, Shim } from 'fabric-shim';
import Logger from '../util/logger';

const logger = Logger.getLogger('RemoverCC');

export class RemoverCC implements ChaincodeInterface {
    private namespaces: string[];

    public async Init(stub: ChaincodeStub): Promise<ChaincodeResponse> {
        logger.debug('entering >>> Init');
        const namespaces = stub.getFunctionAndParameters().params;
        return await this.Initialize(namespaces);
    }

    public async Initialize(namespaces: string[]): Promise<ChaincodeResponse> {
        logger.debug('entering >>> Initialize');
        if (namespaces.length === 0) {
            return Shim.error(Buffer.from('No namespaces provided to the Init() method.'));
        }
        this.namespaces = namespaces;
        logger.info('Namespaces: ' + this.namespaces.join(','));
        return Shim.success(Buffer.from('RemoverCC initialized Successfully!'));
    }

    public async Invoke(stub: ChaincodeStub): Promise<ChaincodeResponse> {
        logger.debug('entering >>> Invoke');
        const funcAndParams = stub.getFunctionAndParameters();
        switch (funcAndParams.fcn) {
            case 'Ping':
                return await this.Ping(stub);
            case 'DeleteState':
                return await this.DeleteState(stub);
        }

        const errorMsg = 'Could not find function named: ' + funcAndParams.fcn;
        return Shim.error(Buffer.from(errorMsg));
    }

    public async Ping(stub: ChaincodeStub): Promise<ChaincodeResponse> {
        logger.debug('entering >>> Ping');
        return Shim.success(Buffer.from('Ping to chaincode successful.'));
    }

    public async DeleteState(stub: ChaincodeStub): Promise<ChaincodeResponse> {
        logger.debug('entering >>> deleteState');
        logger.info('Deleting data for namespaces: ' + this.namespaces.join(','));
        let totalRecordsDeleted = 0;
        for (const namespace of this.namespaces) {
            logger.debug('Deleting data in namespace: ' + namespace);
            totalRecordsDeleted += await this.DeleteRecordsByPartialKey(stub, namespace);
        }

        logger.info('Total number of records deleted: ' + totalRecordsDeleted);
        return Shim.success(Buffer.from(totalRecordsDeleted.toString()));
    }

    private async DeleteRecordsByPartialKey(stub: ChaincodeStub, namespace: string): Promise<number> {
        logger.debug('entering >>> DeleteRecordsByPartialKey');
        let recordsDeletedCount = 0;
        const iterator = await stub.getStateByPartialCompositeKey(namespace, []);
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                logger.debug('Record found: ' + res.value.value.toString('utf8'));
                const key = res.value.key;
                logger.debug('About to delete record with composite key: ' + key);
                await stub.deleteState(key);
                logger.debug('Successfully deleted record with composite key: ' + key);
                recordsDeletedCount++;
            }
            if (res.done) {
                await iterator.close();
                break;
            }
        }

        logger.debug('Total number of records deleted: ' + recordsDeletedCount);
        logger.debug('Finished deleting all records found in: ' + namespace);
        return recordsDeletedCount;
    }
}
