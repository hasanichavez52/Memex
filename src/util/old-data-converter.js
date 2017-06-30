import docuri from 'docuri'
import uniqBy from 'lodash/fp/uniqBy'
import chunk from 'lodash/fp/chunk'
import flatten from 'lodash/fp/flatten'

import db from 'src/pouchdb'
import randomString from 'src/util/random-string'
import { generatePageDocId } from 'src/page-storage'
import { generateVisitDocId } from 'src/activity-logger'
import { STORAGE_KEY as BLACKLIST_KEY } from 'src/options/blacklist/constants'

export const INDEX_KEY = 'index'
export const BOOKMARKS_KEY = 'bookmarks'

/**
 * @typedef IBlacklistOldExt
 * @type {Object}
 * @property {Array<String>} PAGE An array of blocked pages (UNUSED).
 * @property {Array<String>} SITE An array of blocked sites (UNUSED).
 * @property {Array<String>} REGEX An array of strings to use to match sites.
 */

/**
 * @typedef IPageOldExt
 * @type {Object}
 * @property {String} text The extracted page text.
 * @property {String} time The time the page data was stored.
 * @property {String} title The page title.
 * @property {String} url The URL pointing to the page.
 */

/**
 * @param {IPageOldExt} pageData Page data from old extension to convert to visit doc.
 * @param {string} assocPageDocId The `_id` of the associated page doc.
 */
const convertToMinimalVisit = assocPageDoc => ({ time, url }) => ({
    _id: generateVisitDocId({ timestamp: time }),
    visitStart: time,
    url,
    page: { _id: assocPageDoc._id },
})

// TODO: Merge with imports code
const transformToVisitDoc = assocPageDoc => visitItem => ({
    _id: generateVisitDocId({
        timestamp: visitItem.visitTime,
        // We set the nonce manually, to prevent duplicating items if
        // importing multiple times (thus making importHistory idempotent).
        nonce: visitItem.visitId,
    }),
    visitStart: visitItem.visitTime,
    referringVisitItemId: visitItem.referringVisitId,
    url: assocPageDoc.url,
    page: { _id: assocPageDoc._id },
})

// TODO: Merge with imports code
const pageKeyPrefix = 'page/'
const pageDocsSelector = { _id: { $gte: pageKeyPrefix, $lte: `${pageKeyPrefix}\uffff` } }
const bookmarkKeyPrefix = 'bookmark/'
const convertBookmarkDocId = docuri.route(`${bookmarkKeyPrefix}:timestamp/:nonce`)
const generateBookmarkDocId = ({
    timestamp = Date.now(),
    nonce = randomString(),
} = {}) => convertBookmarkDocId({ timestamp, nonce })

/**
 * @param {IPageOldExt} oldPage
 * @return {IPageDoc} The converted minimal page doc.
 */
const transformToPageDoc = isStub => ({ text, time, title, url }) => ({
    _id: generatePageDocId({ timestamp: time }),
    title,
    url,
    isStub,
    content: {
        fullText: text,
        title,
    },
})

/**
 * @param {IPageDoc} assocPageDoc The page doc with which to associate this bookmark doc.
 * @param {IPageOldExt} oldPage
 * @return {IBookmarkDoc} The converted minimal bookmark doc.
 */
const transformToBookmarkDoc = assocPageDoc => ({ text, time, title, url }) => ({
    _id: generateBookmarkDocId({ timestamp: time }),
    title,
    url,
    page: { _id: assocPageDoc._id },
})

const transformToBlacklistEntry = dateAdded => expression => ({ expression, dateAdded })

/**
 * @param {IBlacklistOldExt} blacklist The old extension-formatted blacklist.
 * @return {String} The new extension serialized array of `{ expression: String, dateAdded: Date }` elements.
 */
function convertBlacklist(blacklist) {
    const mapToNewModel = transformToBlacklistEntry(Date.now())
    const uniqByExpression = uniqBy('expression')

    // Map all old values to enries in new model; uniq them on 'expression'
    const blacklistArr = uniqByExpression([
        ...blacklist.PAGE.map(mapToNewModel),
        ...blacklist.SITE.map(mapToNewModel),
        ...blacklist.REGEX.map(mapToNewModel),
    ])

    return JSON.stringify(blacklistArr) // Serialize it, as stored in new model
}

/**
 * Given old page data, attemps to convert it to the new model and generate any visit docs that can be
 * found in the browser along with a bookmark doc if needed.
 *
 * @param {boolean} isStub Denotes whether to set new pages as stubs to schedule for later import.
 * @param {Array<String>} bookmarkUrls List of URLs denoting bookmark page data.
 * @param {IPageOldExt} pageData The old ext model's page data to convert.
 * @param {IPageDoc?} [assocPageDoc] A page doc found to match the pageData param.
 * @return {Array<any>} List of converted docs ready to insert into PouchDB.
 */
const convertPageData = (isStub, bookmarkUrls) => async (pageData, assocPageDoc) => {
    // Do page conversion + visits generation
    const pageDoc = assocPageDoc || transformToPageDoc(isStub)(pageData)
    const visitItems = await browser.history.getVisits({ url: pageData.url })
    const visitDocs = [
        ...visitItems.map(transformToVisitDoc(pageDoc)), // Visits from browser API
        convertToMinimalVisit(pageDoc)(pageData), // Minimal visit straight from old ext data
    ]

    // Create bookmark doc if URL shows up in bookmark URL list
    const bookmarkDocs = bookmarkUrls.includes(pageData.url) ? [transformToBookmarkDoc(pageDoc)(pageData)] : []

    return [
        pageDoc,
        ...visitDocs,
        ...bookmarkDocs,
    ]
}

/**
 * @param {Array<IPageOldExt>} pageDataArr Array of page data to check against existing data for matches.
 * @return {Array<IPageDoc>} Array of page docs that are deemed to match any of the input data.
 */
const getMatchingPageDocs = async pageDataArr => {
    const pageDataUrls = pageDataArr.map(data => data.url)
    const fields = ['_id', 'url']
    const selector = { ...pageDocsSelector, url: { $in: pageDataUrls } }

    const { docs } = await db.find({ selector, fields })
    return docs
}

/**
 * @param {IBlacklistOldExt} blacklist
 */
const handleBlacklistConversion = blacklist =>
    browser.storage.local.set({ [BLACKLIST_KEY]: convertBlacklist(blacklist) })

/**
 * Performs the conversion of old extension page data to new extension. For each page data
 * in the old model, the following may be inserted into PouchDB:
 *  - 0/1 page docs (0 if processed earlier in index)
 *  - 0/1 bookmark docs (if present in `bookmarkUrls` param)
 *  - 1+ visit docs (1 minimal from old page data + whatever in in the browser history)
 *
 * @param {Array<string>} index The old extension index, containing sorted keys of page data.
 * @param {Array<string>} bookmarkUrls The old extension bookmark tracking list, containing URLs.
 */
async function handlePageDataConversion(index, bookmarkUrls, setAsStubs, chunkSize) {
    const convertOldData = convertPageData(setAsStubs, bookmarkUrls)
    const uniqByUrl = uniqBy('url')

    // Split index into chunks to process at once; reverse to process from latest first
    const indexChunks = chunk(chunkSize)(index.reverse())

    for (const keyChunk of indexChunks) {
        try {
            // Grab old page data from storae, ignoring duplicate URLs
            const oldPageData = uniqByUrl(Object.values(await browser.storage.local.get(keyChunk)))

            // Get any matching pages docs to those data in current chunk
            const matchingPages = await getMatchingPageDocs(oldPageData)

            // Map over local storage chunk, async processing each page data entry
            const docs = await Promise.all(oldPageData.map(data => {
                // Pass in any existing page doc that matches
                const assocPageDoc = matchingPages.find(doc => doc.url === data.url)
                return convertOldData(data, assocPageDoc)
            }))

            // Bulk insert all docs for this chunk
            await db.bulkDocs(flatten(docs))
        } catch (error) {
            console.error('DEBUG: Error encountered in storage conversion:')
            console.error(error)
            continue    // Continue processing next chunk if this one failed
        }
    }
}

/**
 * Converts the old extension's local storage object into one compatible with the new extension's
 * storage models, placing resulting conversions into either PouchDB or local storage, depending on the
 * data converted.
 *
 * @param {boolean} [setAsStubs=false] Denotes whether to set new pages as stubs to schedule for later import.
 * @param {number} [chunkSize=10] The amount of index items to process at any time.
 */
export default async function convertOldData(setAsStubs = false, chunkSize = 10) {
    // Grab initial needed local storage keys, providing defaults if not available
    const {
        [INDEX_KEY]: index,
        [BLACKLIST_KEY]: blacklist,
        [BOOKMARKS_KEY]: bookmarkUrls,
    } = await browser.storage.local.get({
        [INDEX_KEY]: [],
        [BLACKLIST_KEY]: { PAGE: [], SITE: [], REGEX: [] },
        [BOOKMARKS_KEY]: [],
    })

    // Only attempt blacklist conversion if it matches shape of old extension blacklist
    if (Object.prototype.toString.call(blacklist) === '[object Object]'
        && 'PAGE' in blacklist && 'SITE' in blacklist && 'REGEX' in blacklist) {
        await handleBlacklistConversion(blacklist)
    }

    // Only attempt page data conversion if index + bookmark URLs are some sort of arrays
    if (index instanceof Array && bookmarkUrls instanceof Array) {
        await handlePageDataConversion(index, bookmarkUrls, setAsStubs, chunkSize)
    }
}
