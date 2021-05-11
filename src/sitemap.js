'use strict';

const got = require('got');
const { parse } = require('fast-xml-parser');

async function fetchSitemapLinks(sitemapUrl) {
    return got(sitemapUrl)
        .then((response) => {
            var jsonObj = parse(response.body);

            let promises = [];

            if (jsonObj.sitemapindex) {
                jsonObj.sitemapindex.sitemap.forEach((sitemap) => {
                    promises.push(fetchSitemapLinks(sitemap.loc));
                });
            } else {
                promises.push(jsonObj.urlset.url.map((url) => url.loc));
            }

            return Promise.all(promises);
        })
        .then((proms) => {
            return [].concat.apply([], proms);
        });
}

async function fetchHttpStatus(url) {
    return got(url)
        .then((response) => {
            return [url, response.statusCode];
        })
        .catch((err) => {
            return [url, err.response.statusCode];
        });
}

module.exports = {
    fetchSitemapLinks,
    fetchHttpStatus
};
