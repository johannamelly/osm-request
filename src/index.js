import osmAuth from 'osm-auth';
import defaultOptions from './defaultOptions.json';
import { getCurrentIsoTimestamp } from 'helpers/time';
import { removeTrailingSlashes, simpleObjectDeepClone } from 'helpers/utils';
import {
  fetchElementRequest,
  fetchElementRequestFull,
  fetchMapByBbox,
  fetchRelationsForElementRequest,
  fetchWaysForNodeRequest,
  sendElementRequest,
  fetchNotesRequest,
  fetchNotesSearchRequest,
  fetchNoteByIdRequest,
  createNoteRequest,
  genericPostNoteRequest,
  createChangesetRequest,
  changesetCheckRequest,
  updateChangesetTagsRequest,
  deleteElementRequest,
  getUserPreferencesRequest,
  setUserPreferencesRequest,
  getUserPreferenceByKeyRequest,
  setUserPreferenceByKeyRequest,
  deleteUserPreferenceRequest
} from './requests';

/**
 * OSM API request handler
 * @type {Object}
 */
export default class OsmRequest {
  /**
   * @access public
   * @param {Object} [options] Custom options to apply
   */
  constructor(options = {}) {
    this._options = {
      ...defaultOptions,
      ...options
    };

    this._options.endpoint = removeTrailingSlashes(this._options.endpoint);

    this._auth = osmAuth({
      url: this._options.endpoint,
      oauth_consumer_key: this._options.oauthConsumerKey,
      oauth_secret: this._options.oauthSecret,
      oauth_token: this._options.oauthUserToken,
      oauth_token_secret: this._options.oauthUserTokenSecret
    });
  }

  /**
   * Return the API endpoint to use for the requests
   * @return {string} URL of the API endpoint
   */
  get endpoint() {
    return this._options.endpoint;
  }

  /**
   * Retrieve the OSM notes in given bounding box
   * @param {number} left The minimal longitude (X)
   * @param {number} bottom The minimal latitude (Y)
   * @param {number} right The maximal longitude (X)
   * @param {number} top The maximal latitude (Y)
   * @param {number} [limit] The maximal amount of notes to retrieve (between 1 and 10000, defaults to 100)
   * @param {number} [closedDays] The amount of days a note needs to be closed to no longer be returned (defaults to 7, 0 means only opened notes are returned, and -1 means all notes are returned)
   * @return {Promise} Resolves on notes list
   */
  fetchNotes(left, bottom, right, top, limit = null, closedDays = null) {
    return fetchNotesRequest(
      this.endpoint,
      left,
      bottom,
      right,
      top,
      limit,
      closedDays
    );
  }

  /**
   * Fetch OSM notes with textual search
   * @param {string} q Specifies the search query
   * @param {string} [format] It can be 'xml' (default) to get OSM
   * and convert to JSON, 'raw' to return raw OSM XML, 'json' to
   * return GeoJSON, 'gpx' to return GPX and 'rss' to return GeoRSS
   * @param {number} [limit] The maximal amount of notes to retrieve (between 1 and 10000, defaults to 100)
   * @param {number} [closed] The amount of days a note needs to be closed to no longer be returned (defaults to 7, 0 means only opened notes are returned, and -1 means all notes are returned)
   * @param {string} [display_name] Specifies the creator of the returned notes by using a valid display name. Does not work together with the user parameter
   * @param {number} [user] Specifies the creator of the returned notes by using a valid id of the user. Does not work together with the display_name parameter
   * @param {number} [from] Specifies the beginning of a date range to search in for a note
   * @param {number} [to] Specifies the end of a date range to search in for a note. Today date is the default
   * @return {Promise}
   */
  fetchNotesSearch(
    q,
    format = 'xml',
    limit = null,
    closed = null,
    display_name = null,
    user = null,
    from = null,
    to = null
  ) {
    return fetchNotesSearchRequest(
      this.endpoint,
      q,
      format,
      limit,
      closed,
      display_name,
      user,
      from,
      to
    );
  }

  /**
   * Get OSM note by id
   * param {number} noteId Identifier for the note
   * @param {string} format It can be 'xml' (default) to get OSM
   * and convert to JSON, 'raw' to return raw OSM XML, 'json' to
   * return GeoJSON, 'gpx' to return GPX and 'rss' to return GeoRSS
   * @return {Promise}
   */
  fetchNote(noteId, format = 'xml') {
    return fetchNoteByIdRequest(this.endpoint, noteId, format);
  }

  /**
   * Create an OSM note
   * @param {number} lat Specifies the latitude of the note
   * @param {number} lon Specifies the longitude of the note
   * @param {string} text A mandatory text field with arbitrary text containing the note
   * @return {Promise}
   */
  createNote(lat, lon, text) {
    return createNoteRequest(this._auth, this.endpoint, lat, lon, text);
  }

  /**
   * Comment an OSM note
   * @param {string} text A mandatory text field with arbitrary text containing the note
   * @return {Promise}
   */
  commentNote(noteId, text) {
    return genericPostNoteRequest(
      this._auth,
      this.endpoint,
      noteId,
      text,
      'comment'
    );
  }

  /**
   * Close an OSM note
   * @param {string} text A mandatory text field with arbitrary text containing the note
   * @return {Promise}
   */
  closeNote(noteId, text) {
    return genericPostNoteRequest(
      this._auth,
      this.endpoint,
      noteId,
      text,
      'close'
    );
  }

  /**
   * Reopen an OSM note
   * @param {string} text A mandatory text field with arbitrary text containing the note
   * @return {Promise}
   */
  reopenNote(noteId, text) {
    return genericPostNoteRequest(
      this._auth,
      this.endpoint,
      noteId,
      text,
      'reopen'
    );
  }

  /**
   * Send a request to OSM to create a new changeset
   * @param {string} [createdBy]
   * @param {string} [comment]
   * @return {Promise}
   */
  createChangeset(createdBy = '', comment = '') {
    return createChangesetRequest(
      this._auth,
      this.endpoint,
      createdBy,
      comment
    );
  }

  /**
   * Check if a changeset is still open
   * @param {number} changesetId
   * @return {Promise}
   */
  isChangesetStillOpen(changesetId) {
    return changesetCheckRequest(this._auth, this.endpoint, changesetId);
  }

  /**
   * Update changeset tags if still open
   * @param {number} changesetId
   * @param {Object} object use to set multiples tags
   * @throws Will throw an error for any request with http code 40x
   * @return {Promise}
   */
  updateChangesetTags(changesetId, object) {
    return updateChangesetTagsRequest(
      this._auth,
      this.endpoint,
      changesetId,
      object
    );
  }

  /**
   * Create a shiny new OSM node element, in a JSON format
   * @param {number} lat
   * @param {number} lon
   * @param {Object} [properties] Optional, initial properties
   * @return {Object}
   */
  createNodeElement(lat, lon, properties = {}) {
    const element = {
      osm: {
        $: {},
        node: [
          {
            $: {
              lat: lat,
              lon: lon
            },
            tag: []
          }
        ]
      },
      _type: 'node'
    };

    element.osm.node[0].tag = Object.keys(properties).map(propertyName => ({
      $: {
        k: propertyName.toString(),
        v: properties[propertyName].toString()
      }
    }));

    return element;
  }

  /**
   * Fetch an OSM element by its ID and optionnally
   * all other elements referenced by it
   * @param {string} osmId Eg: node/12345
   * @param {Object} options  Optional parameters
   * @param {boolean} [options.full] True for getting all elements referenced by this element
   * @return {Promise}
   */
  fetchElement(osmId, options) {
    if (options && options.full) {
      return fetchElementRequestFull(this.endpoint, osmId);
    } else {
      return fetchElementRequest(this.endpoint, osmId);
    }
  }

  /**
   * Fetch relation(s) from an OSM element
   * @param {string} osmId Eg: node/12345
   * @return {Promise}
   */
  fetchRelationsForElement(osmId) {
    return fetchRelationsForElementRequest(this.endpoint, osmId);
  }

  /**
   * Fetch ways using the given OSM node
   * @param {string} osmId Eg: node/12345
   * @return {Promise} Resolve on ways array (each one can be used as an Element for all other functions)
   */
  fetchWaysForNode(osmId) {
    return fetchWaysForNodeRequest(this.endpoint, osmId);
  }

  /**
   * Add or replace a property in a given element
   * @param {Object} element
   * @param {string} propertyName
   * @param {string} propertyValue
   * @return {Object} A new version of the element
   */
  setProperty(element, propertyName, propertyValue) {
    const elementType = element._type;
    const newElement = simpleObjectDeepClone(element);
    const innerElement = newElement.osm[elementType][0];
    const filteredTags = innerElement.tag
      ? innerElement.tag.filter(tag => tag.$.k !== propertyName.toString())
      : [];

    innerElement.tag = [
      ...filteredTags,
      {
        $: {
          k: propertyName.toString(),
          v: propertyValue.toString()
        }
      }
    ];

    return newElement;
  }

  /**
   * Add or replace several properties in a given element
   * @param {Object} element
   * @param {Object} properties
   * @return {Object} A new version of the element
   */
  setProperties(element, properties) {
    const newElement = simpleObjectDeepClone(element);
    const clonedProperties = simpleObjectDeepClone(properties);
    const propertiesName = Object.keys(clonedProperties);

    const elementType = element._type;
    const innerElement = newElement.osm[elementType][0];
    const filteredTags = innerElement.tag
      ? innerElement.tag.filter(tag => !propertiesName.includes(tag.$.k))
      : [];
    const formattedProperties = propertiesName.map(propertyName => ({
      $: {
        k: propertyName.toString(),
        v: clonedProperties[propertyName].toString()
      }
    }));

    innerElement.tag = [...filteredTags, ...formattedProperties];

    return newElement;
  }

  /**
   * Remove a property from a given element
   * @param {Object} element
   * @param {string} propertyName
   * @return {Object} A new version of the element
   */
  removeProperty(element, propertyName) {
    const elementType = element._type;
    const newElement = simpleObjectDeepClone(element);
    const innerElement = newElement.osm[elementType][0];
    const filteredTags = innerElement.tag.filter(
      tag => tag.$.k !== propertyName
    );

    innerElement.tag = filteredTags;

    return newElement;
  }

  /**
   * Replace the coordinates of the OSM node and return a copy of the element
   * @param {Object} element
   * @param {number} lat
   * @param {number} lon
   * @return {Object} A new version of the element
   */
  setCoordinates(element, lat, lon) {
    const elementType = element._type;
    const newElement = simpleObjectDeepClone(element);
    newElement.osm[elementType][0].$.lat = lat.toString();
    newElement.osm[elementType][0].$.lon = lon.toString();

    return newElement;
  }

  /**
   * Set the current UTC date to a given element
   * @param {Object} element
   * @return {Object} A new version of the element
   */
  setTimestampToNow(element) {
    const elementType = element._type;
    const newElement = simpleObjectDeepClone(element);
    newElement.osm[elementType][0].$.timestamp = getCurrentIsoTimestamp();

    return newElement;
  }

  /**
   * Change the version number (given by API) of an element
   * @param {Object} element
   * @param {int} version
   * @return {Object} A new version of the element
   */
  setVersion(element, version) {
    const elementType = element._type;
    const newElement = simpleObjectDeepClone(element);
    const innerElement = newElement.osm[elementType][0];
    innerElement.$.version = parseInt(version).toString();

    return newElement;
  }

  /**
   * Send an element to OSM
   * @param {Object} element
   * @param {number} changesetId
   * @return {Promise}
   */
  sendElement(element, changesetId) {
    return sendElementRequest(this._auth, this.endpoint, element, changesetId);
  }

  /**
   * Request to fetch all OSM elements within a bbox extent
   * @param {number} left The minimal longitude (X)
   * @param {number} bottom The minimal latitude (Y)
   * @param {number} right The maximal longitude (X)
   * @param {number} top The maximal latitude (Y)
   * @return {Promise}
   */
  fetchMapByBbox(left, bottom, right, top) {
    return fetchMapByBbox(this.endpoint, left, bottom, right, top);
  }

  /**
   * Delete an element from OSM
   * @param {Object} element
   * @param {number} changesetId
   * @return {Promise} Promise with the new version number due to deletion
   */
  deleteElement(element, changesetId) {
    return deleteElementRequest(
      this._auth,
      this.endpoint,
      element,
      changesetId
    );
  }
  /**
   * Get all preferences from connected user
   * @return {Promise} Promise with Well formatted JSON of user preferences
   */
  getUserPreferences() {
    return getUserPreferencesRequest(this._auth, this.endpoint);
  }

  /**
   * Set all preferences for a connected user
   * @param {Object} object An object to provide keys values to create XML preferences
   * @return {Promise} Promise
   */
  setUserPreferences(object) {
    return setUserPreferencesRequest(this._auth, this.endpoint, object);
  }

  /**
   * Get a preference from a key for the connected user
   * @param {string} key The key to retrieve
   * @return {Promise} Promise with the value for the key
   */
  getUserPreferenceByKey(key) {
    return getUserPreferenceByKeyRequest(this._auth, this.endpoint, key);
  }

  /**
   * Set a preference from a key for the connected user
   * @param {string} key The key to set.
   * @param {string} value The value to set. Overwrite existing value if key exists
   * @return {Promise} Promise
   */
  setUserPreferenceByKey(key, value) {
    return setUserPreferenceByKeyRequest(this._auth, this.endpoint, key, value);
  }

  /**
   * Delete a preference from a key for the connected user
   * @param {string} key The key to use.
   * @return {Promise} Promise
   */
  deleteUserPreference(key) {
    return deleteUserPreferenceRequest(this._auth, this.endpoint, key);
  }
}
