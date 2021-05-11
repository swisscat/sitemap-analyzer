const { argv } = require('yargs');
const { fetchSitemapLinks, fetchHttpStatus } = require('./src/sitemap');
const throttle = require('./src/throttle');

const sitemapUrl = argv.url;
const throttleConfig = {
    name: 'FetchUrl',
    batchSize: argv.batchSize || 10
};

let invalidUrls = [];

fetchSitemapLinks(sitemapUrl)
    .then(urls => throttle(urls, (url) => fetchHttpStatus(url)
        .then((res) => {
            let [url, status] = res;
            if (status !== 200) {
                console.log('Invalid URL detected with status ', status, ' : ', url);
                invalidUrls.push(url);
            }
        }), throttleConfig))
    .then(() => console.log(invalidUrls));
