'use strict';

const { SingleBar, Presets } = require('cli-progress');

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

function split(arr, n) {
    var res = [];
    while (arr.length) {
        res.push(arr.splice(0, n));
    }
    return res;
}

const delayMS = (t = 200) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(t);
        }, t);
    });
};

const throttledPromises = (asyncFunction, items = [], batchSize = 1, delay = 500, progress = null) => {
    return new Promise(async (resolve, reject) => {
        const output = [];
        const batches = split(items, batchSize);
        await asyncForEach(batches, async (batch) => {
            const promises = batch.map(asyncFunction);
            const results = await Promise.all(promises);
            if (progress) progress.increment(results.length);
            output.push(...results);
            await delayMS(delay);
        });
        resolve(output);
    });
};

module.exports = async function (data, callback, options = {}) {
    let processOptions = {
        batchSize: options.batchSize || 1,
        name: options.name || 'ThrottledProcess'
    };

    let bar1 = new SingleBar({}, Presets.shades_classic);

    console.log(processOptions.name, ': Detected', data.length, 'records to process');
    bar1.start(data.length, 0);

    const results = await throttledPromises(callback, data, processOptions.batchSize, 0, bar1);
    bar1.stop();
    let failures = [];
    results.forEach((result_1) => {
        if (result_1 && result_1.failed) {
            failures.push(result_1.item);
        }
    });
    if (failures.length) {
        console.error(processOptions.name, ':', failures.length, 'Failures observed');

        if (options.retryFailures) {
            console.error(processOptions.name, ': Re-trying processing failures');
            options.retryFailures
                .call(this, failures)
                .then(throttledProcess.call(this, failures, callback, processOptions))
                .then((newResults) => {
                    return { ...newResults, ...results };
                });
        }
    }
    if (!failures.length) {
        console.log(processOptions.name, ': All records processed successfully');
    }
    return results;
};
